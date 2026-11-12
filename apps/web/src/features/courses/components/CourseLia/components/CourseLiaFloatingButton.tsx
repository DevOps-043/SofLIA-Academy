import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useLiaCourse } from '@/features/courses/context/LiaCourseContext';

import {
  COURSE_LIA_BUTTON_BOTTOM_PX,
  COURSE_LIA_BUTTON_RIGHT_PX,
  COURSE_LIA_BUTTON_SIZE_PX,
  LIA_AVATAR_SRC,
} from '../constants';

export function CourseLiaFloatingButton() {
  const { t } = useTranslation('learn');
  const { isOpen, toggleLia, isInteractionBlocked, setLiaToastMessage } = useLiaCourse();

  return (
    <AnimatePresence>
      {!isOpen && (
        <div
          data-tour="lia-button"
          data-tour-id="soflia-floating-button"
          className="hidden md:block"
          style={{
            position: 'fixed',
            bottom: `${COURSE_LIA_BUTTON_BOTTOM_PX}px`,
            right: `${COURSE_LIA_BUTTON_RIGHT_PX}px`,
            width: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
            height: `${COURSE_LIA_BUTTON_SIZE_PX}px`,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.01)',
            borderRadius: '50%',
          }}
        >
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileHover={isInteractionBlocked ? {} : { scale: 1.05 }}
            whileTap={isInteractionBlocked ? {} : { scale: 0.95 }}
            onClick={isInteractionBlocked ? () => setLiaToastMessage(t('lia.warningDisabledActivities')) : toggleLia}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--color-gray-800)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              cursor: isInteractionBlocked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              overflow: 'hidden',
              filter: isInteractionBlocked ? 'grayscale(100%) opacity(0.5)' : 'none',
            }}
            aria-label={t('lia.openAssistant')}
          >
            <img src={LIA_AVATAR_SRC} alt={t('lia.title')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
