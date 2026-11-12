import type { LessonNote } from './note.service'

import {
  type CompendiumLesson,
  PROMPT_EXTRACT_MAX,
  PROMPT_INPUT_MAX,
  PROMPT_NOTES_PER_LESSON,
  clip,
  sortNotesForPriority,
  stripHtml,
} from './course-compendium.builder'

/**
 * VARIANTE GEMINI del prompt de compendio de curso. TEXTO ORIGINAL, CONGELADO.
 *
 * No se toca para mejorar OpenAI: para eso existe
 * `course-compendium.openai.prompt.ts`.
 */

export function buildCourseCompendiumPromptForGoogle(input: {
  courseTitle: string
  lessons: CompendiumLesson[]
  notesByLesson: Map<string, LessonNote[]>
}): string {
  const outline = input.lessons
    .map(
      (lesson) =>
        `- ${lesson.moduleTitle ? `${lesson.moduleTitle} / ` : ''}${lesson.lessonTitle}`,
    )
    .join('\n')

  const extracts: string[] = []
  let extractsLength = 0

  for (const lesson of input.lessons) {
    const notes = sortNotesForPriority(
      input.notesByLesson.get(lesson.lessonId) || [],
    ).slice(0, PROMPT_NOTES_PER_LESSON)

    for (const note of notes) {
      const extract = `Lección "${lesson.lessonTitle}" — ${note.note_title}: ${clip(stripHtml(note.note_content), PROMPT_EXTRACT_MAX)}`
      if (extractsLength + extract.length > PROMPT_INPUT_MAX) break
      extracts.push(extract)
      extractsLength += extract.length
    }
    if (extractsLength >= PROMPT_INPUT_MAX) break
  }

  return `Genera la síntesis de estudio de un curso completado en SofLIA Academy.

Objetivo:
El usuario acaba de completar el curso. Crea una guía de estudio que le ayude a reforzar y repasar todo lo aprendido, basada en sus apuntes.

Reglas estrictas:
- Responde unicamente con JSON valido que respete exactamente el esquema indicado abajo.
- No uses HTML, markdown, bloques de codigo, estilos, tablas ni enlaces inventados dentro de los textos.
- No inventes datos. Sintetiza solo a partir del temario y los apuntes disponibles.
- Escribe de 2 a 4 parrafos breves en synthesis.
- Incluye de 5 a 10 conceptos en keyConcepts y de 5 a 10 pasos accionables en reviewSteps cuando haya contexto suficiente.
- Usa label para nombrar el concepto o la accion y detail para explicarlo con precision.
- Mantente entre 600 y 1200 palabras.
- Tono profesional, claro y accionable.
- Idioma: usa el idioma principal del contenido; si no es claro, usa español. Traduce tambien todos los valores de titles a ese idioma.

Esquema JSON obligatorio:
{
  "titles": {
    "index": "Índice",
    "synthesis": "Síntesis del curso",
    "concepts": "Conceptos clave",
    "review": "Guía de repaso"
  },
  "synthesis": ["párrafo"],
  "keyConcepts": [{ "label": "concepto", "detail": "explicación" }],
  "reviewSteps": [{ "label": "acción", "detail": "cómo aplicarla" }]
}

Curso: ${input.courseTitle}

Temario (módulos y lecciones en orden):
${outline || 'Sin temario disponible.'}

Apuntes del usuario (extractos):
${extracts.length > 0 ? extracts.join('\n\n') : 'El usuario no tiene apuntes registrados; genera la síntesis a partir del temario.'}`
}
