import type { RefObject } from 'react';
import { unit } from './avatar-model';

export interface AvatarVoiceRefs {
  tone: RefObject<number>;
  bands: RefObject<Float32Array>;
  pitch?: RefObject<number>;
  pitchConfidence?: RefObject<number>;
}

/** Articulación acústica continua: no representa fonemas o palabras alineadas. */
export function voiceArticulation(level: number, tone: number, bands?: ArrayLike<number>) {
  const energy = unit(level); const register = unit(tone);
  const band = (index: number) => unit(bands?.[index] ?? 0);
  const low = (band(0) + band(1) + band(2)) / 3;
  const middle = (band(3) + band(4)) / 2;
  const high = (band(5) + band(6) + band(7)) / 3;
  const total = low + middle + high;
  const voiced = energy > .02 ? Math.pow((energy - .02) / .98, .68) : 0;
  const rounded = total > .01 ? low / total : 1 - register;
  const spread = total > .01 ? (middle * .65 + high) / total : register;
  return {
    open: voiced,
    width: voiced * (7 + spread * 7 - rounded * 2),
    roundness: rounded,
    listenLift: (register - .5) * energy,
    listenTilt: (register - .5) * energy * 7,
    waves: [band(1), band(2), (band(3) + band(4)) / 2, band(5), (band(6) + band(7)) / 2],
  };
}

export function mouthContour(open: number, width: number, roundness: number): string {
  const openness = unit(open); const halfWidth = 7 + Math.max(0, Math.min(15, width));
  const height = .5 + openness * 16;
  const upper = height * (.7 + unit(roundness) * .35);
  const corner = halfWidth * (.85 - unit(roundness) * .2);
  const n = (value: number) => value.toFixed(2);
  return `M${n(50 - halfWidth)} 71 C${n(50 - corner)} ${n(71 - upper)} ${n(50 + corner)} ${n(71 - upper)} ${n(50 + halfWidth)} 71 C${n(50 + corner)} ${n(71 + height)} ${n(50 - corner)} ${n(71 + height)} ${n(50 - halfWidth)} 71Z`;
}
