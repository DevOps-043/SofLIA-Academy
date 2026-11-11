import {
  AGENT_POLICY_ENTRYPOINT,
  AGENT_POLICY_JSON,
  AGENT_POLICY_META_CONTENT,
  AGENT_POLICY_VERSION,
} from '../lib/security/agent-policy'
import { applePlatformScript } from './head-scripts/apple-platform-script'
import { chunkReloadScript } from './head-scripts/chunk-reload-script'
import { themePrepaintScript } from './head-scripts/theme-prepaint-script'
import { viewportHeightScript } from './head-scripts/viewport-height-script'

const agentPolicyJsonScript = JSON.stringify(AGENT_POLICY_JSON).replace(/</g, '\\u003c')

interface RootHeadProps {
  nonce?: string
}

export function RootHead({ nonce }: RootHeadProps) {
  return (
    <>
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: chunkReloadScript }}
      />
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: applePlatformScript }}
      />
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: themePrepaintScript }}
      />
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: viewportHeightScript }}
      />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://odbxqmhbnkfledqcqujl.supabase.co" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://odbxqmhbnkfledqcqujl.supabase.co" />

      <meta name="application-name" content="SofLIA Academy" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="SofLIA Academy" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="rgb(10, 37, 64)" />
      <meta name="x-soflia-agent-policy" content={AGENT_POLICY_META_CONTENT} />
      <meta name="x-soflia-agent-policy-version" content={AGENT_POLICY_VERSION} />
      <meta name="x-soflia-agent-policy-entrypoint" content={AGENT_POLICY_ENTRYPOINT} />
      <script
        id="soflia-agent-policy"
        nonce={nonce}
        suppressHydrationWarning
        type="application/json"
        dangerouslySetInnerHTML={{ __html: agentPolicyJsonScript }}
      />
      <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
    </>
  )
}
