import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { logger } from '../../../lib/logger';

import {
  buildOrganizationInvitationEmailContent,
  buildPasswordResetEmailContent,
} from './email.templates';
import {
  getEmailAppUrl,
  getEmailConfig,
  isEmailConfigValid,
} from './email.utils';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const config = getEmailConfig();

    if (!isEmailConfigValid(config)) {
      logger.error('Email service not configured - check SMTP_* env variables');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          minVersion: 'TLSv1.2',
          ciphers: 'HIGH:!aNULL:!MD5',
        },
      });
    } catch (error) {
      logger.error('Error initializing email service', error);
      this.transporter = null;
    }
  }

  public isReady(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const resetUrl = `${getEmailAppUrl()}/auth/reset-password?token=${resetToken}`;
    const { html, text } = buildPasswordResetEmailContent({
      resetUrl,
      username,
    });

    try {
      const info = await this.transporter.sendMail({
        from: `"SofLIA Academy" <noreply@soflia.ai>`,
        to,
        subject: 'Recuperación de Contraseña - SofLIA Academy',
        text,
        html,
      });

      logger.info('Password reset email sent', {
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending password reset email', error);
      throw new Error('Error sending password reset email');
    }
  }

  async sendOrganizationInvitationEmail(
    to: string,
    invitationToken: string,
    organizationName: string,
    organizationSlug: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const registerUrl = `${getEmailAppUrl()}/auth/${organizationSlug}/register?token=${invitationToken}`;
    const { html, text } = buildOrganizationInvitationEmailContent({
      registerUrl,
      organizationName,
      customMessage,
      organizationLogoUrl,
    });

    try {
      const info = await this.transporter.sendMail({
        from: `"SofLIA Academy" <noreply@soflia.ai>`,
        to,
        subject: `Invitación a ${organizationName}`,
        text,
        html,
      });

      logger.info('Organization invitation email sent', {
        messageId: info.messageId,
        organization: organizationName,
        to,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending organization invitation email', error);
      throw new Error('Error sending organization invitation email');
    }
  }
}

export const emailService = new EmailService();
