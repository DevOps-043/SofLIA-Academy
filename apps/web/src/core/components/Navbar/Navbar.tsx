'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { useTranslation } from 'react-i18next';
import { useLogoEasterEgg } from '../../hooks/useLogoEasterEgg';
import { fadeIn, slideUp } from '../../../shared/utils/animations';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg();
  const { t } = useTranslation('common');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (timeout) return; // debounce: skip if a timeout is already pending
      timeout = setTimeout(() => {
        setIsScrolled(window.scrollY > 50);
        timeout = null;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition duration-300 ${isScrolled
          ? 'backdrop-blur-sm border-b navbar-scrolled'
          : 'bg-transparent'
        }`}
      style={{ willChange: isScrolled ? 'transform' : undefined }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden relative"
              animate={isActivated ? {
                rotate: [0, 360, 0],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <Image
                src="/Logo.png"
                alt={t('navbar.logoAlt')}
                width={56}
                height={56}
                className="w-full h-full object-contain logo-adaptive"
              />
              {/* Efecto visual cuando está activado */}
              {isActivated && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl opacity-50" /* Azul Profundo a Aqua */
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
            <span
              className="font-bold text-xl hidden sm:block text-primary dark:text-white uppercase tracking-tight"
              style={{
                fontFamily: 'var(--font-system-ui)',
                fontWeight: 800,
                letterSpacing: '-0.02em'
              }}
            >
              SofLIA
              <span className="ml-2 px-1.5 py-0.5 text-xs font-bold text-white bg-accent rounded-md tracking-wide uppercase">
                Academy
              </span>
            </span>

            {/* Contador oculto - solo para debugging */}
            {clickCount > 0 && clickCount < 5 && (
              <div className="sr-only">
                {t('navbar.clickCounter', { current: clickCount, total: 5 })}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </motion.nav>
  );
}
