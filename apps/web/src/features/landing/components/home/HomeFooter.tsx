'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './SofliaHome.module.css';

/** Shared footer for the public pages that use the home design system. */
export function HomeFooter() {
  const { t } = useTranslation('home');
  const year = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${styles.shell}`}>
      <div>
        <div className={styles.footerBrand}>
          <span className={styles.footerMark}>
            <Image src="/Logo.png" alt="" fill sizes="32px" className="object-contain" />
          </span>
          SofLIA Academy
        </div>
        <p className={styles.footerCopy}>{t('footer.copyright', { year })}</p>
      </div>
      <nav className={styles.footerLinks} aria-label={t('footer.legalLabel')}>
        <Link href="/privacy">{t('footer.privacy')}</Link>
        <Link href="/terms">{t('footer.terms')}</Link>
        <Link href="/contact">{t('footer.contact')}</Link>
        <Link href="/auth">{t('footer.clientAccess')}</Link>
      </nav>
    </footer>
  );
}
