import Image from 'next/image'
import type { CSSProperties } from 'react'

import styles from './PremiumLoadingScreen.module.css'

export interface PremiumLoadingPalette {
  accent?: string
  background?: string
  border?: string
  muted?: string
  onPrimary?: string
  primary?: string
  surface?: string
  text?: string
}

interface PremiumLoadingScreenProps {
  className?: string
  contained?: boolean
  description?: string
  label?: string
  palette?: PremiumLoadingPalette
}

export function PremiumLoadingScreen({
  className,
  contained = false,
  description,
  label = 'Cargando',
  palette,
}: PremiumLoadingScreenProps) {
  const theme = {
    '--loading-primary': palette?.primary,
    '--loading-accent': palette?.accent,
    '--loading-on-primary': palette?.onPrimary,
    '--loading-canvas': palette?.background,
    '--loading-surface': palette?.surface,
    '--loading-text': palette?.text,
    '--loading-muted': palette?.muted,
    '--loading-border': palette?.border,
  } as CSSProperties

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={[
        styles.screen,
        contained ? styles.contained : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      style={theme}
    >
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.content} role="status">
        <span className={styles.logoStage} aria-hidden="true">
          <Image
            alt=""
            className={styles.logo}
            height={54}
            priority={!contained}
            src="/Logo.png"
            width={40}
          />
          <span className={styles.logoPulse} />
        </span>

        <div className={styles.copy}>
          <span className={styles.brand}>SofLIA Academy</span>
          <h1 className={styles.label}>{label}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>

        <span className={styles.progress} aria-hidden="true">
          <span className={styles.progressLine} />
        </span>
      </div>
    </main>
  )
}
