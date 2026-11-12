export const instructorList = [
  { id: 'inst-1', name: 'Ana Salazar' },
  { id: 'inst-2', name: 'Luis Padilla' },
] as const

export const adminUserFields = [
  'Nombre',
  'Apellido',
  'Correo electronico',
  'Usuario',
  'Cargo',
  'Area',
] as const

export const businessDashboardTasks = [
  'Actualizar cohortes inactivas',
  'Revisar elementos marcados por soporte',
  'Invitar nuevos lideres comerciales',
] as const

export const businessPublicBenefits = [
  'Rutas de aprendizaje por rol',
  'Analitica accionable en tiempo real',
  'Asistente LIA contextual por curso',
  'Automatizacion de seguimiento operativo',
] as const

export const organizations = [
  {
    id: 'org-1',
    name: 'SofLIA Academy Enterprise Norteamerica',
    role: 'Administrador',
    slug: 'soflia-enterprise-north-america',
  },
  {
    id: 'org-2',
    name: 'Pulse Hub Commercial Enablement Studio',
    role: 'Miembro',
    slug: 'pulse-hub-commercial-enablement',
  },
] as const
