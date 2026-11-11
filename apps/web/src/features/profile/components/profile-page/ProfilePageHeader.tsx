'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeft, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './ProfileExperience.module.css'

interface ProfilePageHeaderProps {
  saving: boolean
  goBack: () => void
  handleSave: () => Promise<void>
}

export function ProfilePageHeader({ saving, goBack, handleSave }: ProfilePageHeaderProps) {
  const { t } = useTranslation('common')
  return (
    <header className={styles.nav}>
      <div className={styles.navGroup}>
        <motion.button
          aria-label={t('profile.header.back')}
          className={styles.navBack}
          onClick={goBack}
          type="button"
          whileTap={{ scale: 0.96 }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </motion.button>
        <div className={styles.navIdentity}>
          <span className={styles.navLogo}>
            <Image
              alt=""
              aria-hidden="true"
              className={styles.navLogoImage}
              height={34}
              priority
              src="/Logo.png"
              width={25}
            />
          </span>
          <span className={styles.navCopy}>
            <span className={styles.navTitle}>SofLIA Academy</span>
            <span className={styles.navSubtitle}>Perfil</span>
          </span>
        </div>
      </div>

      <motion.button
        onClick={() => void handleSave()}
        disabled={saving}
        className={styles.saveButton}
        whileTap={!saving ? { scale: 0.98 } : undefined}
        type="button"
      >
        {saving ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        <span className={styles.saveLabel}>
          {saving ? t('profile.header.saving') : t('profile.header.saveChanges')}
        </span>
      </motion.button>
    </header>
  )
}
