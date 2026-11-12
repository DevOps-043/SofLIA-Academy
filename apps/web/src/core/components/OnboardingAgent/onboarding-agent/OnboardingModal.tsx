'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isLastOnboardingStep, shouldShowOnboardingStepAction } from './navigation';
import type { OnboardingStep } from './types';
import { useMotionSafe } from '../../../../lib/utils/motion';

interface OnboardingModalProps {
  currentStep: number;
  isAudioEnabled: boolean;
  isMobile: boolean;
  isSpeaking: boolean;
  isVisible: boolean;
  onActionClick: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onToggleAudio: () => void;
  steps: OnboardingStep[];
}

export function OnboardingModal({
  currentStep,
  isAudioEnabled,
  isMobile,
  isSpeaking,
  isVisible,
  onActionClick,
  onComplete,
  onNext,
  onPrevious,
  onSkip,
  onToggleAudio,
  steps,
}: OnboardingModalProps) {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const step = steps[currentStep];
  const isLastStep = isLastOnboardingStep(currentStep, steps.length);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/80 to-black/70 backdrop-blur-md z-[9998]"
            onClick={onSkip}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.6 }}
              className="relative max-w-4xl w-full pointer-events-auto max-h-[95vh] flex flex-col items-center justify-center"
            >
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
                  <motion.div
                    className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-1 overflow-hidden"
                    animate={{
                      scale: isSpeaking ? [1, 1.08, 1] : 1,
                      boxShadow: isSpeaking
                        ? [
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                            '0 0 80px rgba(168, 85, 247, 0.9)',
                            '0 0 30px rgba(59, 130, 246, 0.6)',
                          ]
                        : '0 0 50px rgba(139, 92, 246, 0.7)',
                    }}
                    transition={{
                      scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                      boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
                      <Image src="/assets/soflia-avatar/badge-idle.webp" alt="LIA" fill sizes="256px" className="object-contain" priority />
                    </div>
                  </motion.div>

                  {!disableHeavy && [...Array(8)].map((_, index) => {
                    const radius = isMobile ? 50 : 70;

                    return (
                      <motion.div
                        key={index}
                        className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                        style={{ left: '50%', top: '50%' }}
                        animate={{
                          x: [0, Math.cos(index * 45 * Math.PI / 180) * radius],
                          y: [0, Math.sin(index * 45 * Math.PI / 180) * radius],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.2,
                          ease: 'easeOut',
                        }}
                      />
                    );
                  })}

                  {isSpeaking && (
                    <motion.div
                      className="absolute inset-6 sm:inset-8 rounded-full border-2 border-white/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
                  className="relative bg-gradient-to-br from-white/95 via-white/90 to-white/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl p-2.5 sm:p-3 md:p-4 w-full overflow-hidden flex-shrink min-h-0"
                >
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-30"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)',
                    }}
                    animate={disableHeavy ? {} : { backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                  />

                  <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 sm:gap-1.5">
                      <motion.button
                        onClick={onToggleAudio}
                        whileHover={{
                          scale: 1.15,
                          rotate: [0, -10, 10, -10, 0],
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17, rotate: { duration: 0.5 } }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-blue-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.span
                          className="relative z-10"
                          animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {isAudioEnabled ? <Volume2 size={14} className="sm:w-4 sm:h-4" /> : <VolumeX size={14} className="sm:w-4 sm:h-4" />}
                        </motion.span>
                      </motion.button>

                      <motion.button
                        onClick={onSkip}
                        whileHover={{
                          scale: 1.15,
                          rotate: 90,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                        }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17, rotate: { duration: 0.3 } }}
                        className="relative p-1.5 sm:p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 shadow-lg overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-red-500/10 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.5, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="relative z-10">
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </span>
                      </motion.button>
                    </div>

                    <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3 justify-center items-center">
                      {steps.map((_, index) => (
                        <motion.div key={index} className="relative" whileHover={{ scale: 1.2 }}>
                          <motion.div
                            className={`h-1 sm:h-1.5 rounded-full transition-all ${
                              index === currentStep
                                ? 'w-6 sm:w-8 md:w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 shadow-lg shadow-blue-500/50'
                                : index < currentStep
                                  ? 'w-4 sm:w-5 md:w-6 bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'w-4 sm:w-5 md:w-6 bg-gray-300 dark:bg-gray-600'
                            }`}
                            animate={
                              index === currentStep && !disableHeavy
                                ? {
                                    scale: [1, 1.15, 1],
                                    boxShadow: [
                                      '0 0 0px rgba(59, 130, 246, 0.5)',
                                      '0 0 20px rgba(168, 85, 247, 0.8)',
                                      '0 0 0px rgba(59, 130, 246, 0.5)',
                                    ],
                                  }
                                : {}
                            }
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          {index === currentStep && !disableHeavy && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-md opacity-50"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center space-y-1.5 sm:space-y-2">
                      <motion.h2
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight px-2"
                      >
                        {step.title}
                      </motion.h2>

                      <motion.p
                        key={`description-${currentStep}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light px-2"
                      >
                        {step.description}
                      </motion.p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-2 sm:mt-3 md:mt-4">
                      {currentStep > 0 && (
                        <motion.button
                          onClick={onPrevious}
                          whileHover={{ scale: 1.08, x: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className="relative w-full sm:w-auto px-4 sm:px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors shadow-md border border-gray-200 dark:border-gray-600 text-xs sm:text-sm overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-600/0 dark:via-gray-600/50 dark:to-gray-600/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{t('onboarding.buttons.previous')}</span>
                        </motion.button>
                      )}

                      {shouldShowOnboardingStepAction(step, currentStep, steps.length) && step.action && (
                        <motion.button
                          onClick={onActionClick}
                          whileHover={{ scale: 1.08, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 text-xs sm:text-sm overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{step.action.label}</span>
                          <motion.span className="relative z-10" whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      )}

                      {!isLastStep ? (
                        <motion.button
                          onClick={onNext}
                          whileHover={{ scale: 1.08, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className="relative w-full sm:w-auto px-5 sm:px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xl shadow-blue-500/30 dark:shadow-blue-500/20 text-xs sm:text-sm overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                          <span className="relative z-10">{t('onboarding.buttons.next')}</span>
                          <motion.span className="relative z-10" whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
                          </motion.span>
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={onComplete}
                          whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)' }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className="relative w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold shadow-xl shadow-green-500/30 dark:shadow-green-500/20 text-sm sm:text-base overflow-hidden group"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.7, ease: 'easeInOut' }}
                          />
                          <motion.span
                            className="relative z-10"
                            animate={disableHeavy ? {} : { scale: [1, 1.05] }}
                            transition={{ type: 'tween', duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                          >
                            {t('onboarding.buttons.start')}
                          </motion.span>
                        </motion.button>
                      )}
                    </div>

                    {!isLastStep && (
                      <motion.div className="text-center mt-2 sm:mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <motion.button
                          onClick={onSkip}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-xs sm:text-sm transition-colors font-medium group"
                        >
                          <span className="relative z-10">{t('onboarding.buttons.skipIntro')}</span>
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
