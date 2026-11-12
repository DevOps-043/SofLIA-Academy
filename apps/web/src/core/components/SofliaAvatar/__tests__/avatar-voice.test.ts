import { describe, expect, it } from 'vitest';
import { voiceArticulation, mouthContour } from '../avatar-voice';
import { estimateVoicePitch } from '../voice-pitch';

function sine(hz: number, amplitude = .3, sampleRate = 48000) {
  return Uint8Array.from({ length: 2048 }, (_, index) => Math.round(128 + Math.sin(index * Math.PI * 2 * hz / sampleRate) * 127 * amplitude));
}
describe('registro vocal y articulación acústica', () => {
  it.each([110, 160, 250, 440, 580])('estima %s Hz sin otro analizador ni captura', hz => {
    const pitch = estimateVoicePitch(sine(hz), 48000);
    expect(pitch.confidence).toBeGreaterThan(.9);
    expect(pitch.hz).toBeCloseTo(hz, 0);
  });
  it('distingue grave y agudo a distinto volumen', () => {
    expect(estimateVoicePitch(sine(160, .1), 48000).normalized).toBeLessThan(estimateVoicePitch(sine(440, .5), 48000).normalized);
  });
  it('rechaza silencio y entradas fuera de contrato', () => {
    expect(estimateVoicePitch(new Uint8Array(2048).fill(128), 48000).confidence).toBe(0);
    expect(estimateVoicePitch(new Uint8Array(10), 48000).confidence).toBe(0);
    expect(estimateVoicePitch(sine(160), NaN).confidence).toBe(0);
    expect(estimateVoicePitch(sine(900), 48000).confidence).toBe(0);
  });
  it('abre más al hablar fuerte y cambia anchura y redondez según el espectro', () => {
    const low = voiceArticulation(.8, .15, [1, 1, .8, .1, .1, 0, 0, 0]);
    const high = voiceArticulation(.8, .9, [0, 0, .1, .6, .9, .7, 1, 1]);
    expect(low.roundness).toBeGreaterThan(high.roundness);
    expect(high.width).toBeGreaterThan(low.width);
    expect(voiceArticulation(.9, .5).open).toBeGreaterThan(voiceArticulation(.2, .5).open);
    expect(mouthContour(low.open, low.width, low.roundness)).not.toBe(mouthContour(high.open, high.width, high.roundness));
    expect(voiceArticulation(0, .5).open).toBe(0);
    expect(mouthContour(NaN, 0, .5)).not.toContain('NaN');
  });
});
