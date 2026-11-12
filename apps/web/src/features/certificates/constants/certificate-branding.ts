import type { CertificatePlatformBrand, CertificateVisualTokens } from '@/features/certificates/types/certificate'

export const SOFLIA_PLATFORM_BRAND: CertificatePlatformBrand = {
  name: 'SofLIA Academy',
  logoUrl: '/icono.png',
}

export const DEFAULT_CERTIFICATE_VISUAL_TOKENS: CertificateVisualTokens = {
  primaryColor: 'var(--color-primary)',
  accentColor: 'var(--color-accent)',
  borderColor: 'var(--color-legacy-d6e3f1)',
  backgroundColor: 'var(--color-legacy-f7fbff)',
  textColor: 'var(--color-legacy-0f172a)',
  mutedColor: 'var(--color-gray-600)',
}

export const CERTIFICATE_RENDER_WIDTH_PX = 1200
export const CERTIFICATE_RENDER_HEIGHT_PX = 849
