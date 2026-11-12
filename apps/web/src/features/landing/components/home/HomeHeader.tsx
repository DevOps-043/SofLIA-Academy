'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Download, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageMenu } from './LanguageMenu';
import { Magnet } from './react-bits/Magnet';
import { StarBorder } from './react-bits/StarBorder';
import { ThemeToggle } from './ThemeToggle';
import styles from './SofliaHome.module.css';

// Absolute paths so the anchors also work from other public pages (/downloads).
const NAV_ITEMS = [
  { key: 'system', href: '/#sistema' },
  { key: 'method', href: '/#metodologia' },
  { key: 'services', href: '/#servicios' },
] as const;

export function HomeHeader() {
  const { t } = useTranslation('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    const closeOnDesktop = () => {
      if (window.matchMedia('(min-width: 960px)').matches) closeMenu();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop, { passive: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [isMenuOpen]);

  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} aria-label={t('nav.homeLabel')}>
          <span className={styles.brandMark}>
            <Image src="/Logo.png" alt="" fill sizes="36px" className="object-contain" priority />
          </span>
          <span className={styles.brandName}>SofLIA Academy</span>
        </Link>

        <nav
          className={styles.desktopNav}
          aria-label={t('nav.primaryLabel')}
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={styles.navLink}
              onMouseEnter={() => setHoveredNav(item.key)}
              onFocus={() => setHoveredNav(item.key)}
            >
              {hoveredNav === item.key ? (
                <motion.span
                  layoutId="header-nav-pill"
                  className={styles.navPill}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  aria-hidden="true"
                />
              ) : null}
              <span className={styles.navLinkLabel}>{t(`nav.${item.key}`)}</span>
            </a>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <div className={styles.headerUtilities}>
            <LanguageMenu />
            <Magnet strength={0.3}>
              <ThemeToggle />
            </Magnet>
            <Magnet className={styles.headerDownloadMagnet} strength={0.25}>
              <StarBorder
                className={styles.headerDownloadBorder}
                innerClassName={styles.headerDownloadInner}
                speed="5s"
              >
                <Link href="/downloads" className={styles.headerDownload}>
                  <Download size={15} aria-hidden="true" />
                  {t('nav.downloadHub')}
                </Link>
              </StarBorder>
            </Magnet>
            <Magnet className={styles.headerCtaMagnet} strength={0.25}>
              <Link href="/auth" className={styles.headerCta}>
                {t('nav.clientAccess')}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </Magnet>
          </div>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-controls="home-mobile-menu"
            aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              className={styles.mobileMenuBackdrop}
              onClick={closeMenu}
              aria-label={t('nav.closeMenu')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              id="home-mobile-menu"
              className={styles.mobileMenu}
              aria-label={t('nav.mobileLabel')}
              initial={{ opacity: 0, y: -12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.mobileMenuHeading}>
                <span>{t('nav.mobileLabel')}</span>
                <span aria-hidden="true">01 — 03</span>
              </div>

              <div className={styles.mobileNavLinks}>
                {NAV_ITEMS.map((item, index) => (
                  <a key={item.key} href={item.href} onClick={closeMenu}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {t(`nav.${item.key}`)}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                ))}
              </div>

              <div className={styles.mobileMenuActions}>
                <Link
                  href="/downloads"
                  className={styles.mobileDownload}
                  onClick={closeMenu}
                >
                  <Download size={16} aria-hidden="true" />
                  {t('nav.downloadHub')}
                </Link>
                <Link
                  href="/auth"
                  className={styles.mobileAccess}
                  onClick={closeMenu}
                >
                  {t('nav.clientAccess')}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <div className={styles.mobileUtilityRow}>
                <LanguageMenu />
                <ThemeToggle />
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
