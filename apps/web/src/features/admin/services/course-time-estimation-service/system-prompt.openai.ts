import type { PromptModelProfile } from '@/lib/ai/prompts'

/**
 * VARIANTE OPENAI del prompt de estimación de tiempos.
 *
 * Copia adaptada del prompt de Gemini (`system-prompt.google.ts`). Diferencias:
 *
 * 1. LA ADVERTENCIA SOBRE heuristicMinutes SE AÍSLA Y SE JUSTIFICA. En el
 *    original es la cuarta línea de una lista de ocho. Es el fallo dominante de
 *    esta tarea —el modelo copia la heurística en vez de estimar— y un modelo
 *    literal la respeta mucho mejor cuando entiende que ese valor es una pista
 *    sesgada, no una respuesta.
 *
 * 2. SIN "Devuelve solo JSON valido": la API ya impone el formato.
 */

const RULES = `## Reglas de estimacion

- Cada tiempo es un entero en minutos.
- Estima desde cero a partir del contenido: complejidad cognitiva, numero de pasos, longitud, preguntas, prompts, evidencia requerida y esfuerzo esperado.
- Los videos se calculan aparte. No anadas su duracion.
- No sobreestimes actividades de tipo ai_chat, reflexiones cortas ni ejercicios breves.
- Si el contenido es ambiguo, da tu mejor estimacion profesional y marca confidence como "low" o "medium".`

const HEURISTIC_WARNING = `## Sobre heuristicMinutes

El campo heuristicMinutes y las senales que lo acompanan son un calculo automatico previo, no una respuesta. Se incluyen solo como apoyo tecnico y con frecuencia son incorrectos.

Estima cada tiempo por tu cuenta a partir del contenido. Si tu estimacion coincide con heuristicMinutes, que sea porque llegaste ahi analizando, no por copiarlo.`

const OUTPUT_SCHEMA = `## Formato de salida

{"items":[{"targetId":"...","estimatedMinutes":6,"confidence":"medium","rationale":"motivo breve"}]}`

const REASONING_HINT = `Para cada elemento, valora primero cuanto esfuerzo real exige antes de escribir el numero.`

export function buildSystemPromptForOpenAi(profile: PromptModelProfile): string {
  return [
    'Eres analista experto en tiempos estimados para contenido educativo en SofLIA Academy.',
    'Tu tarea es definir el tiempo estimado real de los materiales y actividades que todavia no tienen tiempo guardado.',
    profile.reasonsInternally ? '' : REASONING_HINT,
    HEURISTIC_WARNING,
    RULES,
    OUTPUT_SCHEMA,
  ]
    .filter(Boolean)
    .join('\n\n')
}
