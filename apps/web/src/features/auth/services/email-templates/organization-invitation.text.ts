import type { OrganizationInvitationTemplateInput } from './types';

export function buildOrganizationInvitationText(
  input: OrganizationInvitationTemplateInput,
  customMessage?: string
) {
  return `
Invitación de ${input.organizationName} en SofLIA Academy

Hola,

Has sido invitado/a a unirte a ${input.organizationName} en nuestra plataforma de capacitación y desarrollo profesional.

${customMessage ? `Mensaje del administrador:\n"${customMessage}"\n` : ''}

Para completar tu registro y configurar tu cuenta, accede al siguiente enlace:
${input.registerUrl}

INFORMACIÓN IMPORTANTE:
- Esta invitación tiene una validez de 7 días.
- El enlace es de uso único y personal.

Atentamente,
Equipo de SofLIA Academy en colaboración con ${input.organizationName}

---
Este es un mensaje automático enviado a través de SofLIA Academy. Por favor, no respondas a este correo.
    `.trim();
}
