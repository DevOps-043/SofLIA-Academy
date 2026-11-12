'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useLiaPanel } from '../../contexts/LiaPanelContext';
import { useMotionSafe } from '../../../lib/utils/motion';
import { useOrganizationStore } from '../../stores/organizationStore';
import { resolveOrganizationBrandColors } from '../../theme/organization-brand-colors';

const LIA_BUTTON_BOTTOM_PX = 24;
const LIA_BUTTON_RIGHT_PX = 24;
const LIA_BUTTON_SIZE_PX = 56;

function LiaFloatingButtonContent() {
  const { isOpen, togglePanel } = useLiaPanel();
  const { disableHeavy } = useMotionSafe();
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization);
  // Con el branding apagado el botón vuelve al degradado de plataforma.
  const brand = resolveOrganizationBrandColors(currentOrganization);
  const orgAccent = brand.hasBranding ? brand.accentColor : null;
  const orgSecondary = brand.hasBranding ? brand.secondaryColor : null;
  const btnGradient = orgAccent
    ? `linear-gradient(135deg, ${orgAccent} 0%, ${orgSecondary || orgAccent} 100%)`
    : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-legacy-00a893) 100%)';
  const btnShadow = orgAccent
    ? `0 4px 20px color-mix(in srgb, ${orgAccent} 40%, transparent)`
    : '0 4px 20px rgba(0, 212, 179, 0.4)';
  const btnPulseColor = orgAccent || 'var(--color-accent)';

  return (
    <>
      <AnimatePresence>
        {!isOpen ? (
          <div
            data-tour="lia-button"
            data-tour-id="soflia-floating-button"
            style={{
              position: 'fixed',
              bottom: `calc(${LIA_BUTTON_BOTTOM_PX}px + env(safe-area-inset-bottom, 0px))`,
              right: `calc(${LIA_BUTTON_RIGHT_PX}px + env(safe-area-inset-right, 0px))`,
              width: `${LIA_BUTTON_SIZE_PX}px`,
              height: `${LIA_BUTTON_SIZE_PX}px`,
              zIndex: 11000,
              background: 'rgba(0,0,0,0.01)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.button
              initial={disableHeavy ? false : { scale: 0, opacity: 0 }}
              animate={disableHeavy ? undefined : { scale: 1, opacity: 1 }}
              exit={disableHeavy ? undefined : { scale: 0, opacity: 0 }}
              transition={disableHeavy ? undefined : { type: 'spring', stiffness: 400, damping: 20 }}
              whileHover={disableHeavy ? undefined : { scale: 1.1 }}
              whileTap={disableHeavy ? undefined : { scale: 0.95 }}
              onClick={togglePanel}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: btnGradient,
                boxShadow: btnShadow,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                willChange: disableHeavy ? 'auto' : 'transform',
              }}
              aria-label="Abrir asistente SofLIA"
            >
              {/* Pulse ring — hidden on mobile to prevent constant GPU use */}
              {!disableHeavy && (
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: btnPulseColor,
                    zIndex: 0,
                  }}
                  animate={{
                    scale: [1, 1.4, 1.4],
                    opacity: [0.4, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}

              <img
                src="/assets/soflia-avatar/badge-idle.webp"
                alt="SofLIA"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </motion.button>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function LiaFloatingButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(<LiaFloatingButtonContent />, document.body);
}
