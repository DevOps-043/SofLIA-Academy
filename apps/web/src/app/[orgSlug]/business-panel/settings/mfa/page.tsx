import type { Metadata } from 'next'

import { MfaSettingsPanel } from '@/features/auth/components/MfaSettingsPanel'

export const metadata: Metadata = {
  title: 'MFA | SofLIA Academy',
  description: 'Multi-factor authentication settings for business administrators.',
}

export default function BusinessPanelMfaSettingsPage() {
  return (
    <main className="space-y-6">
      <MfaSettingsPanel />
    </main>
  )
}
