import rules from './avatar-draft-rules.json';
import type { AvatarExpression } from './avatar-model';

const draftRules = rules.map(rule => ({ expression: rule.expression as AvatarExpression, pattern: new RegExp(rule.pattern, 'i') }));
const normalize = (text: string) => text.slice(0, 4000).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Reacción decorativa local: nunca autoriza acciones ni diagnostica al usuario. */
export function draftExpression(text: string): AvatarExpression {
  if (!text.trim()) return 'idle';
  const normalized = normalize(text);
  return draftRules.find(rule => rule.pattern.test(normalized))?.expression ?? 'curious';
}

export type TaskOutcome = 'success' | 'failure' | 'pending' | 'unknown' | 'cancelled';
export function toolOutcome(serialized?: string): TaskOutcome {
  if (!serialized || serialized.length > 2_000_000) return 'unknown';
  let result: Record<string, unknown>;
  try { result = JSON.parse(serialized); } catch { return 'unknown'; }
  if (!result || typeof result !== 'object' || Array.isArray(result)) return 'unknown';
  const status = String(result.status ?? '').toLowerCase();
  if (result.cancelled === true || /^(cancelled|canceled|aborted)$/.test(status)) return 'cancelled';
  if (result.success === false || result.error || /^(failed|error|blocked)$/.test(status)) return 'failure';
  if (result.partial === true || result.uncertain === true || result.backgroundJobId || /^(pending|running|started|accepted|queued|in_progress)$/.test(status)) return 'pending';
  return result.success === true ? 'success' : 'unknown';
}

export function responseExpression(text: string, calls: ReadonlyArray<{ result?: string }> = []): AvatarExpression {
  const outcomes = calls.map(call => toolOutcome(call.result));
  if (outcomes.includes('failure')) return 'concerned';
  if (outcomes.includes('pending')) return 'focused';
  if (outcomes.length && outcomes.every(outcome => outcome === 'success')) return 'success';
  const normalized = normalize(text);
  if (/^(no pude|no he podido|no puedo completar|no fue posible|no se pudo|ocurrio un error|no obtuve)/.test(normalized)) return 'concerned';
  if (/\b(no estoy segur[oa]|necesito aclarar|podrias aclarar|te refieres a)\b/.test(normalized)) return 'confused';
  if (/\b(sorprendente|increible|que interesante)\b/.test(normalized)) return 'surprised';
  if (/\b(autorizas|me das permiso|confirmas que)\b/.test(normalized)) return 'warning';
  return 'acknowledging';
}

export interface AvatarActivity {
  scope?: string;
  phase: 'idle' | 'thinking' | 'executing' | 'responding' | 'complete' | 'failed' | 'cancelled';
  expression?: AvatarExpression;
  tool?: string;
  version: number;
}
