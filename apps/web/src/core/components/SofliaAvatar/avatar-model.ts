export const AVATAR_EXPRESSIONS = ['idle', 'listening', 'thinking', 'speaking', 'success', 'warning', 'curious', 'happy', 'confused', 'focused', 'acknowledging', 'sleeping', 'surprised', 'concerned'] as const;
export type AvatarExpression = typeof AVATAR_EXPRESSIONS[number];
export type AvatarState = AvatarExpression | 'acting';
export interface GazeTarget { x: number; y: number }
export interface GazeConfig { maxX: number; maxY: number; radius: number; responseMs: number }
export const DEFAULT_GAZE: GazeConfig = { maxX: .027, maxY: .018, radius: 4.5, responseMs: 105 };

export const EXPRESSION_LABELS: Record<AvatarExpression, string> = {
  idle: 'En espera', listening: 'Escuchando', thinking: 'Pensando', speaking: 'Respondiendo', success: 'Éxito', warning: 'Advertencia',
  curious: 'Curiosidad', happy: 'Alegría', confused: 'Duda', focused: 'Concentración', acknowledging: 'Confirmación', sleeping: 'En reposo',
  surprised: 'Sorpresa', concerned: 'Preocupación',
};
const PRIORITY = new Set<AvatarState>(['listening', 'thinking', 'acting', 'speaking', 'success', 'warning', 'focused', 'sleeping']);
export function resolveExpression(state: AvatarState, expression?: AvatarExpression): AvatarExpression {
  if (state === 'acting') return 'focused';
  return PRIORITY.has(state) ? state : expression ?? state;
}
export function canTrackGaze(expression: AvatarExpression): boolean {
  return ['idle', 'curious', 'happy', 'acknowledging', 'surprised', 'concerned'].includes(expression);
}
export function unit(value: number): number { return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0; }
export function normalizeGaze(x: number, y: number): GazeTarget {
  return { x: Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0, y: Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0 };
}
export function gazeFromPointer(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, radius: number): GazeTarget {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  const x = (clientX - rect.left - rect.width * 0.51) / (rect.width * 0.5);
  const y = (clientY - rect.top - rect.height * 0.51) / (rect.height * 0.5);
  const distance = Math.hypot(x, y);
  if (distance > radius) return { x: 0, y: 0 };
  const startReturn = Math.max(1, radius * .7);
  const falloff = distance > startReturn ? Math.max(0, (radius - distance) / Math.max(.01, radius - startReturn)) : 1;
  const target = normalizeGaze(x, y);
  return { x: target.x * falloff, y: target.y * falloff };
}
export function interpolate(current: number, target: number, elapsedMs: number, responseMs: number): number {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, elapsedMs) / Math.max(16, responseMs)));
}
export function configureGaze(config?: Partial<GazeConfig>): GazeConfig {
  const positive = (value: number | undefined, fallback: number, max: number) => value !== undefined && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
  return { maxX: positive(config?.maxX, DEFAULT_GAZE.maxX, .035), maxY: positive(config?.maxY, DEFAULT_GAZE.maxY, .025), radius: positive(config?.radius, DEFAULT_GAZE.radius, 10), responseMs: positive(config?.responseMs, DEFAULT_GAZE.responseMs, 2000) };
}
