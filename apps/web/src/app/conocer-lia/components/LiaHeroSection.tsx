import Image from 'next/image';
import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { useMotionSafe } from '../../../lib/utils/motion';

interface LiaHeroSectionProps {
  heroRef: RefObject<HTMLElement | null>;
  heroInView: boolean;
}

export function LiaHeroSection({ heroRef, heroInView }: LiaHeroSectionProps) {
  const { disableHeavy } = useMotionSafe()
  return (
    <section ref={heroRef} className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 text-primary dark:text-white leading-tight"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 900 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            Conoce a <span className="text-accent">SofLIA</span>
          </motion.h1>

          <motion.p
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-gray-500 dark:text-white/80 leading-relaxed mb-4"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Tu asistente inteligente de aprendizaje. SofLIA te guía, responde tus preguntas y te ayuda a dominar la
            inteligencia artificial.
          </motion.p>

          <motion.p
            className="text-lg lg:text-xl max-w-2xl mx-auto text-accent font-semibold"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 600 }}
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            "SofLIA piensa, SofLIA te acompaña"
          </motion.p>
        </motion.div>

        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="relative w-64 h-64 lg:w-80 lg:h-80">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary opacity-20 blur-2xl"
              animate={disableHeavy ? {} : { scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="absolute inset-0 rounded-full border-4 border-accent/30"
              animate={disableHeavy ? {} : { rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              className="absolute inset-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-2xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src="/assets/soflia-avatar/badge-idle.webp"
                alt="SofLIA - Asistente Inteligente"
                width={320}
                height={320}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
