'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useLiaPanel } from '../../contexts/LiaPanelContext';
import avatarStyles from '../SofliaAvatar/SofliaAvatarSlot.module.css';
import { useMotionSafe } from '../../../lib/utils/motion';

const LIA_BUTTON_BOTTOM_PX = 24;
const LIA_BUTTON_RIGHT_PX = 24;
const LIA_BUTTON_SIZE_PX = 96;

function LiaFloatingButtonContent() {
  const { isOpen, togglePanel } = useLiaPanel();
  const { disableHeavy } = useMotionSafe();

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
              background: 'transparent',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.button
              className={avatarStyles.launcher}
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
                borderRadius: 0,
                background: 'transparent',
                boxShadow: 'none',
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
              <img
                src="/assets/soflia-avatar/badge-idle.webp"
                alt="SofLIA"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 0,
                  objectFit: 'contain',
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
