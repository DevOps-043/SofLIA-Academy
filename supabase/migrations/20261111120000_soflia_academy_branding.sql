-- Use the Academy brand for newly provisioned MFA factors. Existing factors
-- retain their issuer so their metadata still matches enrolled authenticators.
ALTER TABLE public.user_mfa_factors
  ALTER COLUMN issuer SET DEFAULT 'SofLIA Academy';
