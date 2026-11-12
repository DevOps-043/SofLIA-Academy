import {
  ensureAbsoluteUrl,
  escapeHtml,
  getEmailAppUrl,
  getSofliaLogoUrl,
} from '../email.utils';
import { organizationInvitationFooterStyles } from './organization-invitation-footer.styles';
import { organizationInvitationEmailStyles } from './organization-invitation.styles';
import { buildOrganizationInvitationText } from './organization-invitation.text';
import type { OrganizationInvitationTemplateInput } from './types';

export function buildOrganizationInvitationEmailContent(
  input: OrganizationInvitationTemplateInput
) {
  const appUrl = input.appUrl || getEmailAppUrl();
  const year = input.year ?? new Date().getFullYear();
  const safeOrganizationName = escapeHtml(input.organizationName);
  const safeRegisterUrl = escapeHtml(input.registerUrl);
  const normalizedCustomMessage = input.customMessage?.trim();
  const safeCustomMessage = normalizedCustomMessage
    ? escapeHtml(normalizedCustomMessage)
    : '';
  const absoluteOrgLogoUrl = ensureAbsoluteUrl(input.organizationLogoUrl, appUrl);
  const safeOrgLogoUrl = absoluteOrgLogoUrl
    ? escapeHtml(absoluteOrgLogoUrl)
    : undefined;
  const safeSofliaLogoUrl = escapeHtml(getSofliaLogoUrl(appUrl));

  return {
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación - ${safeOrganizationName}</title>
        <style>${organizationInvitationEmailStyles}${organizationInvitationFooterStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${safeOrgLogoUrl
              ? `<img src="${safeOrgLogoUrl}" alt="${safeOrganizationName}" class="org-logo" />`
              : `<p class="org-name">${safeOrganizationName}</p>`}
          </div>
          <div class="content">
            <h1 class="title">Invitación de ${safeOrganizationName}</h1>
            <p class="text">Hola,</p>
            <p class="text">Has sido invitado/a a unirte a <strong>${safeOrganizationName}</strong> en SofLIA Academy, nuestra plataforma de aprendizaje y desarrollo continuo.</p>
            ${safeCustomMessage
              ? `<div class="custom-message">"${safeCustomMessage}"</div>`
              : ''}
            <div class="button-container">
              <a href="${safeRegisterUrl}" class="button">Configurar mi cuenta</a>
            </div>
            <div class="divider"></div>
            <div class="link-section">
              <p class="link-label">Si el botón no funciona, copia y pega el siguiente enlace:</p>
              <div class="link-box">${safeRegisterUrl}</div>
            </div>
            <div class="info-section">
              <p class="info-title">Detalles de la invitación</p>
              <ul class="info-list">
                <li>Válida durante 7 días.</li>
                <li>Acceso exclusivo para tu correo electrónico.</li>
                <li>Plataforma segura impulsada por IA.</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p class="footer-text">Enviado a través de</p>
            <img src="${safeSofliaLogoUrl}" alt="SofLIA Academy" class="footer-logo" />
            <p class="footer-text">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
            <p class="footer-copyright">&copy; ${year} SofLIA Academy. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: buildOrganizationInvitationText(input, normalizedCustomMessage),
  };
}
