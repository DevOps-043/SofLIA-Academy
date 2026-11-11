import { clip, type LessonAutoNotePromptInput } from './lesson-auto-note.service'

/**
 * VARIANTE GEMINI del prompt de auto-nota de lección. TEXTO ORIGINAL, CONGELADO.
 *
 * No se toca para mejorar OpenAI: para eso existe
 * `lesson-auto-note.openai.prompt.ts`.
 */

export function buildLessonAutoNotePromptForGoogle(input: LessonAutoNotePromptInput): string {
  return `Genera un apunte automatico de leccion para SofLIA Academy.

Objetivo:
Crear una nota concisa, estrategica y util para que el usuario recuerde y aplique lo aprendido al completar la leccion, tenga o no quiz o conversacion.

Reglas estrictas:
- Responde unicamente con JSON valido que respete exactamente el esquema indicado abajo.
- No uses HTML, markdown, bloques de codigo, estilos, tablas ni enlaces inventados dentro de los textos.
- No inventes datos. Si falta contexto en una seccion, resume con lo disponible.
- No copies la conversacion completa con SofLIA; la transcripcion completa se añadira automaticamente despues de tu resumen.
- Usa de 1 a 3 parrafos breves en strategicSummary y lessonOverview.
- Usa de 3 a 6 elementos concretos en lessonKeyPoints, sofliaHighlights y reviewChecklist cuando haya contexto suficiente.
- Para activityFeedback y quizFeedback, usa label para el tema o pregunta y detail para la retroalimentacion accionable.
- Mantente conciso: entre 500 y 900 palabras.
- Tono profesional, claro y accionable.
- Idioma: usa el idioma principal del contenido; si no es claro, usa español. Traduce tambien todos los valores de titles a ese idioma.

Esquema JSON obligatorio:
{
  "titles": {
    "index": "Índice",
    "summary": "Resumen estratégico",
    "lessonContent": "Video, lectura y reflexión",
    "sofliaHighlights": "Puntos clave de mi interacción con SofLIA",
    "activityFeedback": "Retroalimentación de la actividad",
    "quizFeedback": "Retroalimentación del quiz",
    "review": "Para repasar"
  },
  "strategicSummary": ["párrafo"],
  "lessonOverview": ["párrafo"],
  "lessonKeyPoints": [{ "label": "concepto", "detail": "explicación" }],
  "sofliaHighlights": [{ "label": "hallazgo", "detail": "por qué importa" }],
  "activityFeedback": [{ "label": "actividad", "detail": "retroalimentación" }],
  "quizFeedback": [{ "label": "pregunta o concepto", "detail": "respuesta clave y explicación" }],
  "reviewChecklist": ["acción de repaso"]
}

Curso: ${input.courseTitle}
Leccion: ${input.lessonTitle}
Descripcion: ${clip(input.lessonDescription, 900) || 'Sin descripcion disponible.'}

Resumen existente de la leccion:
${clip(input.lessonSummary, 2500) || 'No hay resumen disponible.'}

Transcripcion / video:
${clip(input.transcript, 5500) || 'No hay transcripcion disponible.'}

Lecturas, reflexiones y entregas:
${input.activityNotes.length > 0 ? input.activityNotes.join('\n\n') : 'No hay entregas o lecturas adicionales disponibles.'}

Interacciones relevantes con SofLIA:
${input.dialogueHighlights.length > 0 ? input.dialogueHighlights.join('\n\n') : 'No hay interacciones SofLIA disponibles para esta leccion.'}

Quiz y retroalimentacion:
${input.quizReviews.length > 0 ? input.quizReviews.join('\n\n') : 'No hay detalle de quiz disponible.'}`
}
