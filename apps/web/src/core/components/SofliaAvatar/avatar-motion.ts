import type { AvatarExpression } from './avatar-model';

interface MotionProfile {
  period: number;
  vertical: number;
  horizontal: number;
  tilt: number;
  face: number;
  restTilt?: number;
  faceHorizontal: number;
  faceTilt: number;
}

// Amplitudes relativas a la imagen; todos los perfiles son continuos y acotados.
export const AVATAR_MOTION_PROFILES: Record<AvatarExpression, MotionProfile> = {
  idle: { period: 3.8, vertical: .007, horizontal: .002, tilt: .6, face: .007, faceHorizontal: .003, faceTilt: 1.5 },
  listening: { period: 2.6, vertical: .006, horizontal: .001, tilt: .6, face: .007, faceHorizontal: .002, faceTilt: 1.5 },
  thinking: { period: 2.8, vertical: .008, horizontal: .002, tilt: .8, face: .011, faceHorizontal: .008, faceTilt: 3 },
  speaking: { period: 2.2, vertical: .007, horizontal: .001, tilt: .7, face: .008, faceHorizontal: .003, faceTilt: 1.8 },
  success: { period: 2, vertical: .01, horizontal: .001, tilt: .6, face: .009, faceHorizontal: .002, faceTilt: 1.5 },
  warning: { period: 2.8, vertical: .006, horizontal: .002, tilt: .7, face: .007, faceHorizontal: .004, faceTilt: 1.8 },
  curious: { period: 3.2, vertical: .007, horizontal: .002, tilt: 1, restTilt: -1, face: .01, faceHorizontal: .005, faceTilt: 4 },
  happy: { period: 2.4, vertical: .009, horizontal: .002, tilt: .8, restTilt: .5, face: .011, faceHorizontal: .004, faceTilt: 2.5 },
  confused: { period: 3.3, vertical: .007, horizontal: .002, tilt: 1, restTilt: 1, face: .009, faceHorizontal: .005, faceTilt: 4 },
  focused: { period: 3.6, vertical: .006, horizontal: .001, tilt: .3, face: .006, faceHorizontal: .004, faceTilt: 1 },
  acknowledging: { period: 1.3, vertical: .003, horizontal: 0, tilt: 0, face: .028, faceHorizontal: 0, faceTilt: 0 },
  sleeping: { period: 5, vertical: .009, horizontal: .001, tilt: .3, face: .006, faceHorizontal: .002, faceTilt: 1 },
  surprised: { period: 2.4, vertical: .007, horizontal: .001, tilt: .6, face: .012, faceHorizontal: .003, faceTilt: 2 },
  concerned: { period: 3.6, vertical: .006, horizontal: .001, tilt: .5, face: .009, faceHorizontal: .004, faceTilt: 2.5 },
};

/** Pose ambiental independiente de la amplitud de voz y de los gestos manuales. */
export function ambientMotion(expression: AvatarExpression, elapsedMs: number) {
  const profile = AVATAR_MOTION_PROFILES[expression];
  const time = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0) / 1000;
  const phase = time * Math.PI * 2 / profile.period;
  return {
    y: Math.sin(phase) * profile.vertical,
    x: Math.sin(phase * .5) * profile.horizontal,
    tilt: (profile.restTilt ?? 0) + Math.sin(phase * .5) * profile.tilt,
    faceY: Math.sin(phase + .35) * profile.face,
    faceX: Math.sin(phase * .75) * profile.faceHorizontal,
    faceTilt: Math.sin(phase * .5 + .5) * profile.faceTilt,
    pulse: .5 + Math.sin(phase) * .5,
    counterPulse: .5 + Math.sin(phase + Math.PI * .7) * .5,
  };
}
