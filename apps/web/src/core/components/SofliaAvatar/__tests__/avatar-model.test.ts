import { describe, expect, it } from 'vitest';
import { ambientMotion } from '../avatar-motion';
import { AVATAR_EXPRESSIONS, canTrackGaze, configureGaze, gazeFromPointer, interpolate, normalizeGaze, resolveExpression, unit } from '../avatar-model';

describe('contratos y prioridades del avatar 2D', () => {
  it('mantiene gestos continuos y acotados para las catorce expresiones sin señal externa', () => {
    const profiles = new Set<string>();
    for (const expression of AVATAR_EXPRESSIONS) {
      const start = ambientMotion(expression, 0);
      const later = ambientMotion(expression, 440);
      expect(later.y).not.toBe(start.y);
      expect(Math.abs(later.y)).toBeLessThan(.03);
      expect(Math.abs(later.x)).toBeLessThan(.006);
      expect(Math.abs(later.tilt)).toBeLessThan(6);
      expect(later.pulse).toBeGreaterThanOrEqual(0); expect(later.pulse).toBeLessThanOrEqual(1);
      profiles.add(JSON.stringify(later));
    }
    expect(profiles.size).toBe(14);
  });
  it('confirma con asentimiento vertical recurrente sin deriva ni rotación lateral', () => {
    for (const time of [325, 975, 2925, 3575, 6825]) {
      const pose = ambientMotion('acknowledging', time);
      expect(Math.abs(pose.y)).toBeLessThan(.004);
      expect(Math.abs(pose.faceY)).toBeGreaterThan(.024);
      expect(Math.abs(pose.faceX)).toBe(0); expect(Math.abs(pose.faceTilt)).toBe(0);
      expect(Math.abs(pose.x)).toBe(0); expect(Math.abs(pose.tilt)).toBe(0);
    }
  });
  it('ofrece catorce expresiones y conserva estados críticos ante decoraciones', () => {
    expect(new Set(AVATAR_EXPRESSIONS).size).toBe(14);
    for (const state of ['listening', 'thinking', 'speaking', 'warning', 'success', 'sleeping'] as const) {
      expect(resolveExpression(state, 'happy')).toBe(state);
      expect(canTrackGaze(state)).toBe(false);
    }
    expect(resolveExpression('acting', 'curious')).toBe('focused');
    expect(resolveExpression('idle', 'curious')).toBe('curious');
  });
  it('normaliza según el rectángulo transformado y vuelve al reposo fuera del radio', () => {
    const rect = { left: 100, top: 200, width: 200, height: 100 };
    expect(gazeFromPointer(202, 251, rect, 3)).toEqual({ x: 0, y: 0 });
    expect(gazeFromPointer(330, 251, rect, 3)).toEqual({ x: 1, y: 0 });
    expect(gazeFromPointer(1000, 251, rect, 3)).toEqual({ x: 0, y: 0 });
    expect(gazeFromPointer(1, 1, { ...rect, width: 0 }, 3)).toEqual({ x: 0, y: 0 });
  });
  it('interpola sin depender de la frecuencia de fotogramas', () => {
    const twoFrames = interpolate(interpolate(0, 1, 16, 150), 1, 16, 150);
    expect(twoFrames).toBeCloseTo(interpolate(0, 1, 32, 150), 10);
    expect(twoFrames).toBeGreaterThan(0); expect(twoFrames).toBeLessThan(1);
  });
  it('limita entradas no finitas y desplazamientos peligrosos', () => {
    expect(normalizeGaze(Infinity, -8)).toEqual({ x: 0, y: -1 });
    expect(unit(NaN)).toBe(0); expect(unit(8)).toBe(1); expect(unit(-1)).toBe(0);
    expect(configureGaze({ maxX: 1, maxY: -1, radius: Infinity, responseMs: NaN })).toEqual({ maxX: .035, maxY: 0, radius: 4.5, responseMs: 105 });
  });
});
