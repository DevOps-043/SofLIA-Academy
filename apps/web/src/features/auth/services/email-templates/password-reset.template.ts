import { escapeHtml } from '../email.utils';
import { passwordResetEmailStyles } from './password-reset.styles';
import type { PasswordResetTemplateInput } from './types';

export function buildPasswordResetEmailContent(
  input: PasswordResetTemplateInput
) {
  const year = input.year ?? new Date().getFullYear();
  const safeUsername = escapeHtml(input.username);
  const safeResetUrl = escapeHtml(input.resetUrl);

  return {
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>${passwordResetEmailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SofLIA Academy</div>
            <h1>Recuperación de Contraseña</h1>
          </div>
          <p>Hola <strong>${safeUsername}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeResetUrl}" class="button">Restablecer mi contraseña</a>
          </div>
          <p style="text-align: center; color: rgb(102, 102, 102); font-size: 14px;">
            O copia y pega este enlace en tu navegador:
          </p>
          <div class="link-box">${safeResetUrl}</div>
          <div class="warning">
            <strong>Importante:</strong>
            <ul>
              <li>Este enlace expira en <strong>1 hora</strong></li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Tu contraseña actual permanece segura hasta que la cambies</li>
            </ul>
          </div>
          <p style="margin-top: 30px;">
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
            Tu cuenta permanece segura.
          </p>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
            <p>&copy; ${year} SofLIA Academy. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Recuperación de Contraseña - SofLIA Academy

Hola ${input.username},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${input.resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.

Saludos,
Equipo SofLIA Academy

---
Este es un email automático, por favor no respondas a este mensaje.
    `.trim(),
  };
}
