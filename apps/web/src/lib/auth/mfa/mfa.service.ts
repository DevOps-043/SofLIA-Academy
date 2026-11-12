import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fromLoose } from '@/lib/supabase/looseQuery';

import {
  constantTimeCompareHash,
  decryptSecret,
  encryptSecret,
  hashRecoveryCode,
} from './secret-cipher';
import {
  createProvisioning,
  generateRecoveryCodes,
  verifyTotp,
} from './totp';

const ISSUER = 'SofLIA Academy';

type MfaFactorStatus = 'pending' | 'active' | 'revoked';

type MfaFactorRow = {
  id: string;
  created_at: string;
  factor_type: 'totp';
  issuer: string;
  label: string | null;
  last_used_at: string | null;
  recovery_codes_hashed: string[];
  revoked_at: string | null;
  secret_encrypted: Buffer | string;
  status: MfaFactorStatus;
  user_id: string;
  verified_at: string | null;
};

type MfaFactorWrite = Partial<MfaFactorRow> & {
  user_id?: string;
};

export interface MfaProvisioningResult {
  factorId: string;
  uri: string;
  secret: string;
  recoveryCodes: string[];
}

export interface MfaStatus {
  enabled: boolean;
  factorId: string | null;
  lastUsedAt: string | null;
  recoveryCodesRemaining: number;
}

export interface MfaUser {
  id: string;
  email: string;
}

export class MfaError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = 'MfaError';
  }
}

async function getSupabase() {
  return createClient();
}

function mfaFactorsTable(client: unknown) {
  return fromLoose<MfaFactorRow, MfaFactorWrite>(client, 'user_mfa_factors');
}

const MFA_STATUS_DISABLED: MfaStatus = {
  enabled: false,
  factorId: null,
  lastUsedAt: null,
  recoveryCodesRemaining: 0,
};

/**
 * Detecta errores que indican que la infraestructura de MFA aun no esta
 * desplegada (tabla o columna `user_mfa_factors` inexistente).
 *
 * Cuando la migracion `20260518130000_mfa_totp_factors.sql` no se ha
 * aplicado, la lectura de estado MFA falla. En ese caso NO se debe bloquear
 * el login: si la tabla no existe, ningun usuario puede tener MFA, asi que
 * lo correcto es degradar a "sin MFA" y dejar continuar el login. Bloquear
 * todos los inicios de sesion por una migracion pendiente seria una
 * auto-denegacion de servicio.
 */
function isMissingMfaInfrastructureError(error: {
  code?: string | null;
  message?: string | null;
}): boolean {
  const code = error.code ?? '';
  // 42P01 = undefined_table, 42703 = undefined_column,
  // PGRST205 = tabla ausente del schema cache, PGRST204 = columna ausente.
  if (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST205' ||
    code === 'PGRST204'
  ) {
    return true;
  }

  const message = (error.message ?? '').toLowerCase();
  return (
    message.includes('user_mfa_factors') &&
    (message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache'))
  );
}

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const supabase = await getSupabase();
  return readMfaStatus(supabase, userId);
}

export async function getMfaStatusForLogin(userId: string): Promise<MfaStatus> {
  return readMfaStatus(createAdminClient(), userId);
}

async function readMfaStatus(
  supabase: unknown,
  userId: string,
): Promise<MfaStatus> {
  const { data, error } = await mfaFactorsTable(supabase)
    .select('id, status, last_used_at, recovery_codes_hashed')
    .eq('user_id', userId)
    .eq('factor_type', 'totp')
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Migracion MFA pendiente: degradar a "sin MFA" en vez de bloquear el login.
    if (isMissingMfaInfrastructureError(error)) {
      return MFA_STATUS_DISABLED;
    }
    throw new MfaError('MFA_STATUS_READ_FAILED', error.message);
  }

  if (!data) {
    return MFA_STATUS_DISABLED;
  }

  return {
    enabled: data.status === 'active',
    factorId: data.id,
    lastUsedAt: data.last_used_at,
    recoveryCodesRemaining: data.recovery_codes_hashed?.length ?? 0,
  };
}

export async function provisionMfaFactor(user: MfaUser): Promise<MfaProvisioningResult> {
  const supabase = await getSupabase();
  const { secret, uri } = createProvisioning({
    accountName: user.email,
    issuer: ISSUER,
  });
  const recoveryCodes = generateRecoveryCodes();
  const recoveryHashed = recoveryCodes.map(hashRecoveryCode);
  const secretEncrypted = encryptSecret(secret);

  await mfaFactorsTable(supabase)
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .in('status', ['pending']);

  const { data, error } = await mfaFactorsTable(supabase)
    .insert({
      user_id: user.id,
      factor_type: 'totp',
      status: 'pending',
      secret_encrypted: secretEncrypted,
      recovery_codes_hashed: recoveryHashed,
      issuer: ISSUER,
      label: user.email,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new MfaError('MFA_PROVISION_FAILED', error?.message);
  }

  return {
    factorId: data.id,
    uri,
    secret,
    recoveryCodes,
  };
}

export async function activateMfaFactor(
  user: MfaUser,
  factorId: string,
  token: string,
): Promise<void> {
  const supabase = await getSupabase();
  const { data, error } = await mfaFactorsTable(supabase)
    .select('secret_encrypted, status')
    .eq('id', factorId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) throw new MfaError('MFA_FACTOR_NOT_FOUND');
  if (data.status !== 'pending') throw new MfaError('MFA_FACTOR_NOT_PENDING');

  const secret = decryptSecret(Buffer.from(data.secret_encrypted));
  if (!verifyTotp(secret, token)) {
    throw new MfaError('MFA_INVALID_TOKEN');
  }

  const { error: updateError } = await mfaFactorsTable(supabase)
    .update({
      status: 'active',
      verified_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    })
    .eq('id', factorId)
    .eq('user_id', user.id);

  if (updateError) throw new MfaError('MFA_ACTIVATE_FAILED', updateError.message);
}

export async function verifyMfaToken(user: MfaUser, token: string): Promise<boolean> {
  const supabase = await getSupabase();
  return verifyMfaTokenWithClient(supabase, user, token);
}

export async function verifyMfaTokenForLogin(user: MfaUser, token: string): Promise<boolean> {
  return verifyMfaTokenWithClient(createAdminClient(), user, token);
}

async function verifyMfaTokenWithClient(
  supabase: unknown,
  user: MfaUser,
  token: string,
): Promise<boolean> {
  const { data, error } = await mfaFactorsTable(supabase)
    .select('id, secret_encrypted, recovery_codes_hashed')
    .eq('user_id', user.id)
    .eq('factor_type', 'totp')
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new MfaError('MFA_VERIFY_READ_FAILED', error.message);
  if (!data) return false;

  const secret = decryptSecret(Buffer.from(data.secret_encrypted));
  if (verifyTotp(secret, token)) {
    await mfaFactorsTable(supabase)
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    return true;
  }

  const candidateHash = hashRecoveryCode(token);
  const matchingHash = data.recovery_codes_hashed.find((stored: string) =>
    constantTimeCompareHash(candidateHash, stored),
  );
  if (matchingHash) {
    const remaining = data.recovery_codes_hashed.filter((entry: string) => entry !== matchingHash);
    await mfaFactorsTable(supabase)
      .update({
        recovery_codes_hashed: remaining,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    return true;
  }

  return false;
}

export async function disableMfaFactor(user: MfaUser, token: string): Promise<void> {
  const supabase = await getSupabase();
  const verified = await verifyMfaToken(user, token);
  if (!verified) throw new MfaError('MFA_INVALID_TOKEN');

  const { error } = await mfaFactorsTable(supabase)
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw new MfaError('MFA_DISABLE_FAILED', error.message);
}

export async function regenerateRecoveryCodes(user: MfaUser, token: string): Promise<string[]> {
  const supabase = await getSupabase();
  const verified = await verifyMfaToken(user, token);
  if (!verified) throw new MfaError('MFA_INVALID_TOKEN');

  const codes = generateRecoveryCodes();
  const hashed = codes.map(hashRecoveryCode);

  const { error } = await mfaFactorsTable(supabase)
    .update({ recovery_codes_hashed: hashed })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw new MfaError('MFA_REGENERATE_FAILED', error.message);
  return codes;
}
