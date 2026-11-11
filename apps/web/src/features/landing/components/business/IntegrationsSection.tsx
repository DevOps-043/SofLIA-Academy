'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { fadeIn, staggerContainer } from '../../../../shared/utils/animations';
import { IntegrationCard } from './integrations-section/IntegrationCard';
import { integrations } from './integrations-section/integrations.config';

export function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2 className="mb-6 text-4xl font-bold lg:text-5xl" variants={fadeIn}>
            Integraciones Potentes
          </motion.h2>
          <motion.p className="mx-auto max-w-3xl text-xl" variants={fadeIn}>
            Conecta SofLIA Academy Business con tus herramientas favoritas
          </motion.p>
        </motion.div>

        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {integrations.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} />
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm opacity-70">
            Necesitas una integracion especifica?{' '}
            <a href="#contact" className="font-medium text-primary hover:underline">
              Contactanos para desarrollarla
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
