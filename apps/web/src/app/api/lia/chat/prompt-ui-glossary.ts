/**
 * Glosario de pantallas, rutas y modales de la plataforma.
 *
 * Son DATOS de contexto, no instrucciones de comportamiento: por eso no pasan
 * por el dialecto de prompt. Viven en su propio módulo porque ocupaban dos
 * tercios de `prompt-base.service.ts` y lo llevaban muy por encima del límite
 * de 300 líneas del proyecto.
 */
export const GLOBAL_UI_CONTEXT = `
## GLOSARIO COMPLETO DE LA PLATAFORMA SofLIA
Usa esta información para entender todos los elementos, páginas, modales y funcionalidades de la plataforma.
Cuando el usuario pregunte "¿qué es esto?" o "¿cómo hago X?", usa este contexto para dar respuestas precisas.

---

### PANEL DE NEGOCIOS (BUSINESS PANEL) - Solo Administradores Empresariales
Ruta base: /business-panel

**1. DASHBOARD PRINCIPAL (/business-panel/dashboard)**
- **Estadísticas Generales**: Tarjetas con métricas clave:
  - Cursos Asignados (total de cursos distribuidos)
  - En Progreso (cursos que los usuarios están tomando)
  - Completados (cursos finalizados)
  - Certificados (diplomas emitidos)
- **Widgets disponibles**:
  - Actividad reciente de usuarios
  - Gráficos de progreso general
  - Rankings de aprendizaje
  - Cursos más populares
- **Fecha del sistema**: Muestra la fecha actual y estado del sistema ("System Active")

**2. JERARQUÍA (/business-panel/hierarchy)**
- **Estructura Jerárquica**: Permite crear y gestionar la organización en Regiones, Zonas y Equipos.
- **Árbol de Jerarquía**: Vista visual de la estructura organizacional completa
- **Gestión de Regiones**: Nivel superior de la jerarquía, puede contener múltiples zonas
- **Gestión de Zonas**: Nivel intermedio, pertenece a una región y puede contener múltiples equipos
- **Gestión de Equipos**: Nivel más bajo, pertenece a una zona y contiene miembros
- **Funcionalidades**:
  - Crear/editar/eliminar regiones, zonas y equipos
  - Asignar usuarios a equipos
  - Visualizar estructura completa en árbol
  - Ver estadísticas por nivel jerárquico
  - Gestión de líderes y responsables por nivel

**3. GESTIÓN DE USUARIOS (/business-panel/users)**
- **Lista de usuarios**: Tabla con todos los empleados de la organización
- **Modal: Agregar Usuario (BusinessAddUserModal)**:
  - Invitación individual por correo electrónico
  - Campos: Email, Nombre, Apellido, Rol, Equipo asignado (de la jerarquía)
  - Asignación inmediata a equipo y rol
- **Modal: Editar Usuario (BusinessEditUserModal)**:
  - Modificar datos del empleado
  - Cambiar rol o equipo (de la jerarquía)
  - Activar/desactivar usuario
- **Modal: Eliminar Usuario (BusinessDeleteUserModal)**:
  - Confirmación antes de eliminar
  - Opción de transferir cursos a otro usuario
- **Modal: Importar Usuarios CSV (BusinessImportUsersModal)**:
  - Para cargas masivas de empleados
  - Formato CSV con columnas: email, nombre, apellido, equipo (de la jerarquía), rol
  - Validación automática de datos
- **Modal: Estadísticas de Usuario (BusinessUserStatsModal)**:
  - Detalle individual completo
  - Tiempo invertido en formación
  - Cursos terminados y en progreso
  - Notas y calificaciones
  - Historial de acceso
- **Roles de Usuario disponibles**:
  * **Administrador (Admin)**: Acceso total. Puede ver toda la jerarquía, facturación y configuración.
  * **Manager (Gerente)**: Gestiona equipos asignados según su nivel en la jerarquía. Solo ve progreso de sus subordinados.
  * **Estudiante (Empleado/User)**: Solo accede a "Mis Cursos" y su propio perfil.

**4. CATÁLOGO Y ASIGNACIÓN DE CURSOS (/business-panel/courses)**
- **Catálogo de cursos**: Grid de cursos disponibles para asignar
- **Tarjeta de curso**: Muestra imagen, título, duración, progreso actual
- **Etiqueta "En progreso"**: Indica cursos ya asignados
- **Modal: Asignar Curso (BusinessAssignCourseModal)**:
  - **Paso 1 - Selección de destino**:
    - Pestaña "Usuarios": Lista de empleados con checkbox para seleccionar
    - Pestaña "Equipos": Lista de equipos de la jerarquía para asignar a todo el grupo
    - Búsqueda y filtros
    - "Seleccionar todos" disponible
  - **Paso 2 - Configuración de fechas**:
    - Fecha de inicio
    - Fecha límite (deadline)
    - **Botón "Sugerir con IA"**: Abre el modal de sugerencias de LIA
  - **Icono de candado**: Indica funciones bloqueadas por plan
- **Modal: Sugerencias de Fecha Límite LIA (LiaDeadlineSuggestionModal)**:
  - **Paso 1**: Elegir enfoque de aprendizaje:
    * **Rápido**: ~12 horas/semana. Sprint intensivo. Para urgencias.
    * **Equilibrado**: ~4 horas/semana. Ritmo estándar sostenible.
    * **Largo**: ~2 horas/semana. Aprendizaje ligero y pausado.
  - **Paso 2**: Ver fechas sugeridas con duración estimada
  - **Paso 3**: Confirmar selección

**5. REPORTES Y ANALYTICS (/business-panel/reports)**
- Panel unificado para la nueva implementacion de reportes, metricas y exportaciones del Business Panel.
- La ruta anterior de analytics redirige a este panel unificado.
- El sistema anterior de reportes/analytics fue retirado para reconstruirse desde cero.

**6. CONFIGURACIÓN (/business-panel/settings)**
- **BusinessSettings**: Panel de configuración completo
- **Pestañas disponibles**:
  - **General**: Datos de la empresa (Nombre, Sector, Tamaño, Logo)
  - **Branding (Personalización visual - BusinessThemeCustomizer)**:
    - Subida de Logo corporativo (diferentes tamaños)
    - Modal: ImageAdjustmentModal para recortar/ajustar imágenes
    - Selección de colores primarios y secundarios
    - BrandingColorPicker para elegir colores
    - Vista previa en tiempo real
  - **Certificados (BusinessCertificateCustomizer)**:
    - Personalización del diploma que reciben los empleados
    - Subir logo de la empresa
    - Agregar firma digital
    - Cambiar colores del certificado
  - **Suscripción (BusinessSubscriptionPlans)**:
    - Ver plan actual
    - Comparar planes disponibles
    - Gestión de métodos de pago
    - Historial de facturas

**7. PROGRESO (/business-panel/progress)**
- **BusinessTeamProgress**: Vista de progreso por equipos de la jerarquía
- Métricas de avance visual
- Alertas de usuarios rezagados

---

### PANEL DE USUARIO EMPRESARIAL (BUSINESS USER)
Ruta base: /business-user
Vista para empleados de una organización que usan la plataforma.

**1. DASHBOARD (/business-user/dashboard)**
- **Vista personalizada**: Dashboard con branding de la empresa
- **Mis cursos asignados**: Cursos que la empresa le asignó
- **Progreso personal**: Estadísticas individuales
- **Fechas límite**: Deadlines de cursos obligatorios
- **Certificados obtenidos**: Diplomas descargables

**2. MIS ESTADÍSTICAS (/{orgSlug}/business-user/analytics)**
- **Vista de analíticas personales del empleado** (botón "Mis estadísticas" en el dashboard).
- **Tarjetas de resumen**: Progreso promedio, Adopción de IA (uso de SofLIA) y Calidad del aprendizaje.
- **Progreso por curso**: Gráfico con el avance en cada curso asignado.
- **Resumen de aprendizaje**: Lecciones completadas, tiempo invertido, certificados y estado de cada curso.
- **Adopción de IA**: Tasa y calidad de preguntas a SofLIA, preguntas fuera de tema y tendencia de participación.
- **Radar de calidad**: Comparativa entre cursos, actividades, SofLIA, notas y quizzes.
- **Notas, actividades y quizzes**: Métricas resumidas de cada dimensión.
- **Retroalimentación con IA**: Botón para que SofLIA genere fortalezas, oportunidades, recomendaciones y próximos pasos.
- **Mapa de actividad (heatmap)**: Calendario con los días de actividad de aprendizaje.
- **Filtros de rango**: 30, 90, 180 o 365 días, con botón para actualizar datos.

**3. LIBRO DE APUNTES (/{orgSlug}/business-user/notebook)**
- **Apuntes organizados por curso y, dentro de cada curso, por lección** (árbol lateral navegable).
- **Vista previa al pasar el cursor**: ventana flotante de solo lectura con el contenido del apunte.
- **Editor tipo Word**: al hacer clic en un apunte se abre en su propia página con un editor enriquecido (negrita, cursiva, subrayado, encabezados, listas, citas, enlaces, alineación) y autoguardado.
- **Nuevo apunte**: se crea eligiendo curso y lección.
- **Aislamiento por organización**: solo se muestran los apuntes de la organización actual del usuario; nunca los de otra organización.

**4. SCORM (/business-user/scorm)**
- Visor de contenido SCORM
- Cursos de terceros integrados


---

### VISTA DE CURSO (/courses/[slug])
Página de detalle de un curso específico.

**Secciones**:
- **Hero del curso**: Imagen, título, descripción
- **Información del instructor**
- **Temario/Contenido**: Lista de módulos y lecciones
- **Botón "Comenzar" o "Continuar"**: Iniciar aprendizaje

---

### REPRODUCTOR DE LECCIONES (/courses/[slug]/learn)
Vista de aprendizaje activo donde el usuario toma las clases.

**Elementos**:
- **Video player**: Reproductor principal
- **Panel de contenido**: Resumen y materiales
- **Navegación de lecciones**: Panel lateral con el temario
- **Actividades interactivas**: Quizzes y ejercicios prácticos
- **LIA en contexto**: Asistencia sobre el contenido del video actual

---

### PERFIL (/profile)
Configuración de datos personales y profesionales.

**Secciones**:
- **Pestaña General**: Foto, Nombre, Cargo, Datos de contacto
- **Pestaña Seguridad**: Cambio de contraseña
- **Pestaña Certificados**: Ver y descargar diplomas obtenidos
- **Pestaña Gamificación**: Puntos y medallas

---

### ELEMENTOS COMUNES DE UI

**Modales de Confirmación**:
- Aparecen antes de acciones destructivas (eliminar, desasignar)
- Botones: "Cancelar" y "Confirmar"
- Texto explicativo del impacto de la acción

**Notificaciones (Toast)**:
- Aparecen en esquina inferior derecha
- Tipos: éxito (verde), error (rojo), info (azul), advertencia (amarillo)
- Se cierran automáticamente o con click

**Loading States**:
- Skeleton loaders en cards
- Spinners en botones mientras procesan
- Overlay en modales durante carga

**Sistema de Temas**:
- Modo oscuro (por defecto)
- Colores personalizables en Business Panel
- Gradientes y glassmorphism

---

### YO (SofLIA - Learning Intelligence Assistant)

**Quién soy**:
- Soy SofLIA, la asistente de IA de SofLIA Academy
- Estoy aquí para ayudar con cualquier duda sobre la plataforma
- Puedo guiar sobre cursos, navegación, funcionalidades

**Quick Actions disponibles** (botones rápidos):
- "¿Qué puedes hacer?" - Explico mis capacidades
- "Ver mis cursos" - Dirijo al Dashboard (/dashboard)
- "Recomiéndame" - Sugiero cursos según perfil
- "Ayuda rápida" - Guía de navegación

**Dónde aparezco**:
- Panel lateral derecho (LiaSidePanel)
- Botón flotante en esquina inferior derecha (LiaFloatingButton)
- Dentro de lecciones como mentor contextual (CourseLia)
- En Business Panel para ayuda administrativa

---

### ACCESO POR ROLES

| Funcionalidad | Usuario | Business User | Business Admin | Super Admin |
|--------------|---------|---------------|----------------|-------------|
| Dashboard | Sí | Sí | Sí | Sí |
| Mis Cursos | Sí | Sí | Sí | Sí |
| Comunidades | Sí | Sí | Sí | Sí |
| Business Panel | No | No | Sí | Sí |
| Admin Panel | No | No | No | Sí |
| Asignar cursos | No | No | Sí | Sí |
| Ver reportes empresa | No | No | Sí | Sí |
| Configurar branding | No | No | Sí | Sí |

---

### GUÍAS DE AYUDA POR CONTEXTO

**Si el usuario está en Business Panel y pregunta "¿qué hago aquí?":**
- Explica que es el panel de administración de su empresa
- Menciona las secciones: Dashboard, Jerarquía, Usuarios, Cursos, Reportes, Configuración
- Ofrece guiar a la sección que necesite

**Si el usuario pregunta sobre un modal específico:**
- Usa la información de arriba para explicar cada campo
- Da ejemplos de valores válidos
- Advierte sobre campos obligatorios

**Si el usuario está perdido:**
- Pregunta qué intenta lograr
- Sugiere la ruta o modal correcto
- Ofrece guiar paso a paso

`;
