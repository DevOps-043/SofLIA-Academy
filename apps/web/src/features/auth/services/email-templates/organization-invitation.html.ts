import type { OrganizationInvitationViewModel } from './email-template.types'
import { organizationInvitationEmailStyles } from './organization-invitation.styles'

function renderOrganizationHeader(viewModel: OrganizationInvitationViewModel) {
  if (viewModel.safeOrgLogoUrl) {
    return `<img src="${viewModel.safeOrgLogoUrl}" alt="${viewModel.safeOrganizationName}" class="org-logo" />`
  }

  return `<p class="org-name">${viewModel.safeOrganizationName}</p>`
}

function renderCustomMessage(viewModel: OrganizationInvitationViewModel) {
  if (!viewModel.safeCustomMessage) {
    return ''
  }

  return `<div class="custom-message">"${viewModel.safeCustomMessage}"</div>`
}

export function buildOrganizationInvitationHtml(
  viewModel: OrganizationInvitationViewModel
) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación - ${viewModel.safeOrganizationName}</title>
      <style>${organizationInvitationEmailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">${renderOrganizationHeader(viewModel)}</div>
        <div class="content">
          <h1 class="title">Invitación de ${viewModel.safeOrganizationName}</h1>
          <p class="text">Hola,</p>
          <p class="text">
            Has sido invitado/a a unirte a
            <strong>${viewModel.safeOrganizationName}</strong>
            en SofLIA Academy, nuestra plataforma de aprendizaje y desarrollo continuo.
          </p>
          ${renderCustomMessage(viewModel)}
          <div style="text-align: center; margin: 40px 0;">
            <a href="${viewModel.safeRegisterUrl}" class="button">Configurar mi cuenta</a>
          </div>
          <div style="height: 1px; background-color: rgb(238, 238, 238); margin: 40px 0;"></div>
          <p style="color: rgb(136, 136, 136); font-size: 13px; text-align: center;">
            Si el botón no funciona, copia y pega el siguiente enlace:
          </p>
          <div class="link-box">${viewModel.safeRegisterUrl}</div>
          <div class="info-section">
            <p style="font-size: 14px; font-weight: 700; text-transform: uppercase;">
              Detalles de la invitación
            </p>
            <ul style="color: rgb(102, 102, 102); font-size: 14px;">
              <li>Válida durante 7 días.</li>
              <li>Acceso exclusivo para tu correo electrónico.</li>
              <li>Plataforma segura impulsada por IA.</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p style="color: rgb(136, 136, 136); font-size: 12px;">Enviado a través de</p>
          <img src="${viewModel.safeSofliaLogoUrl}" alt="SofLIA Academy" style="height: 32px;" />
          <p style="color: rgb(136, 136, 136); font-size: 12px;">
            Este es un mensaje automático. Por favor, no respondas a este correo.
          </p>
          <p style="color: rgb(170, 170, 170); font-size: 11px;">
            &copy; ${viewModel.year} SofLIA Academy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
