'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UserDropdown } from '../UserDropdown'
import { HiddenAdminButton } from '../HiddenAdminButton'
import { NotificationBell } from '../NotificationBell'
import { useLogoEasterEgg } from '../../hooks/useLogoEasterEgg'
import { useRouter, usePathname } from 'next/navigation'
import { usePrefetchOnHover } from '../../hooks/usePrefetch'
import { useMotionSafe } from '../../../lib/utils/motion'

interface DashboardNavbarProps {
  activeItem?: string
  showNotificationBell?: boolean
}

const navigationItems: { id: string; nameKey: string; icon: typeof GraduationCap }[] = [
  // Botón de Talleres eliminado
]

export function DashboardNavbar({
  activeItem = 'workshops',
  showNotificationBell = true
}: DashboardNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg()
  const prefetchOnHover = usePrefetchOnHover()
  const { disableHeavy } = useMotionSafe()

  // Determinar item activo basado en pathname para móvil
  const getMobileActiveItem = (): string => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/my-courses') || pathname.startsWith('/courses')) return 'workshops'
    return activeItem
  }

  const mobileActiveItem = getMobileActiveItem()

  const handleNavigation = (itemId: string) => {
    switch (itemId) {
      case 'workshops':
        router.push('/dashboard')
        break
      default:
        break
    }
  }

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white dark:bg-carbon-900 backdrop-blur-sm border-b border-gray-200 dark:border-gray-500/30"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-6 py-2.5 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-14 h-14 rounded-lg overflow-hidden relative"
              animate={isActivated ? {
                rotate: [0, 360, 0],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/Logo.png"
                alt="SofLIA Academy"
                className="w-full h-full object-contain"
              />
              {/* Efecto visual cuando está activado */}
              {isActivated && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>

            {/* Contador oculto - solo para debugging */}
            {clickCount > 0 && clickCount < 5 && (
              <div className="sr-only">
                {t('navbar.clickCounter', { current: clickCount, total: 5 })}
              </div>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              const routeMap: Record<string, string> = {
                'workshops': '/dashboard'
              }
              const href = routeMap[item.id]

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  {...(href && prefetchOnHover(href))}
                  className="relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 overflow-hidden group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Estado activo con gradiente SOFLIA */}
                  {isActive && (
                    <>
                      {/* Fondo con gradiente suave */}
                    <motion.div
                      layoutId="activeIndicator"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent dark:from-accent/15 dark:via-accent/10 dark:to-transparent"
                        initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                          damping: 30
                      }}
                    />
                    </>
                  )}

                  {/* Overlay de hover para estado inactivo */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {/* Icono con animación */}
                  <motion.div
                    className="relative z-10"
                    whileHover={{
                      scale: 1.1,
                      rotate: isActive ? 0 : 5
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17
                    }}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${
                      isActive
                        ? 'text-accent'
                        : 'text-gray-500 dark:text-white/60 group-hover:text-primary dark:group-hover:text-accent'
                    }`} />
                    {/* Glow en icono activo */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-accent blur-md opacity-30 -z-10"
                        animate={disableHeavy ? {} : {
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Texto */}
                  <span className={`relative z-10 tracking-tight transition-all duration-300 ${
                    isActive
                      ? 'text-primary dark:text-white font-semibold'
                      : 'text-gray-500 dark:text-white/60 font-medium group-hover:text-primary dark:group-hover:text-white'
                  }`}>
                    {t(item.nameKey)}
                  </span>

                  {/* Línea inferior decorativa cuando está activo */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 32, opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.2
                      }}
                    />
                  )}

                </motion.button>
              )
            })}
          </nav>

          {/* User Menu con animaciones */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Notificaciones */}
            {showNotificationBell && <NotificationBell />}

            {/* User Dropdown */}
            <UserDropdown />
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation - Diseño mejorado */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-500/30 bg-white/95 dark:bg-carbon-900/95 backdrop-blur-md">
        <div className="grid grid-cols-1 h-[64px]">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = mobileActiveItem === item.id

            return (
              <div key={item.id} className="relative flex items-center justify-center">
                <motion.button
                  onClick={() => handleNavigation(item.id)}
                  className="relative flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 group overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Fondo activo con gradiente */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveBg"
                      className="absolute inset-0 bg-gradient-to-b from-accent/10 via-accent/5 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Indicador superior activo */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileTopNavActive"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-accent to-transparent rounded-b-full"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 64, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        delay: 0.1
                      }}
                    />
                  )}

                  {/* Overlay hover para estado inactivo */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary/5 dark:bg-white/5 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  {/* Icono con animación */}
                  <motion.div
                    className="relative z-10"
                    animate={isActive ? {
                      scale: 1.1,
                      y: -2
                    } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17
                    }}
                    whileHover={!isActive ? {
                      scale: 1.15,
                      y: -2
                    } : {}}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${
                      isActive
                        ? 'text-accent'
                        : 'text-gray-500 dark:text-white/60 group-hover:text-primary dark:group-hover:text-accent'
                    }`} />

                    {/* Glow en icono activo */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-accent blur-lg opacity-20 -z-10"
                        animate={disableHeavy ? {} : {
                          scale: [1, 1.3, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Texto */}
                  <span className={`text-[10px] leading-tight text-center px-1 tracking-tight transition-all duration-300 relative z-10 ${
                    isActive
                      ? 'text-primary dark:text-white font-semibold'
                      : 'text-gray-500 dark:text-white/60 font-medium group-hover:text-primary dark:group-hover:text-white'
                  }`}>
                    {t(item.nameKey)}
                  </span>
                </motion.button>
              </div>
            )
          })}
        </div>
      </div>

    </motion.header>
  )
}
