import { useEffect, useRef, type RefObject } from 'react';
import { canTrackGaze, configureGaze, gazeFromPointer, interpolate, unit, type AvatarExpression, type GazeConfig, type GazeTarget } from './avatar-model';
import { ambientMotion } from './avatar-motion';
import { mouthContour, voiceArticulation, type AvatarVoiceRefs } from './avatar-voice';

export interface AvatarSignals {
  gaze: GazeTarget | null;
  audio: number | null;
  blinkAt: number | null;
  nodAt: number | null;
  resetToken: number;
}

export function useAvatarMotion(expression: AvatarExpression,
  audioLevel: RefObject<number> | undefined, motionEnabled: boolean, gazeConfig?: Partial<GazeConfig>, voiceFeatures?: AvatarVoiceRefs, textActivity = false) {
  const root = useRef<HTMLDivElement>(null);
  const signals = useRef<AvatarSignals>({ gaze: null, audio: null, blinkAt: null, nodAt: null, resetToken: 0 });
  const renderedMotion = useRef({ gazeX: 0, gazeY: 0, level: 0, float: 0, drift: 0, sway: 0, faceLift: 0, faceX: 0, faceTilt: 0, tone: .4, mouthOpen: 0, mouthWidth: 0, mouthRound: .5, eyeOpen: 1, browLift: 0, waves: new Float32Array(5), pulse: .5, counterPulse: .5 });
  const toneRef = voiceFeatures?.tone; const bandsRef = voiceFeatures?.bands;
  const pitchRef = voiceFeatures?.pitch; const confidenceRef = voiceFeatures?.pitchConfidence;
  const { maxX, maxY, radius, responseMs } = configureGaze(gazeConfig);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let intersecting = true;
    let disposed = false;
    let frame: number | null = null;
    let previous = 0;
    let elapsed = 0;
    let blinkEnd: number | null = null;
    let nextBlink = 2500 + Math.random() * 3000;
    let pointer: GazeTarget = { x: 0, y: 0 };
    let pendingPointer: GazeTarget | null = null;
    const rendered = renderedMotion.current;
    let x = canTrackGaze(expression) ? rendered.gazeX : 0;
    let y = canTrackGaze(expression) ? rendered.gazeY : 0;
    let level = rendered.level;
    let lastReset = signals.current.resetToken;
    const rig = element.querySelector('.soflia-avatar__rig') ?? element;
    const mouth = element.querySelector<SVGPathElement>('.avatar-face__mouth');
    let previousMouth = '';
    let rect = rig.getBoundingClientRect();
    const tracks = canTrackGaze(expression);
    signals.current.blinkAt = null;
    signals.current.nodAt = null;
    const lastStyles = new Map<string, string>();
    const css = (name: string, value: number, suffix = '') => {
      const text = `${value.toFixed(4)}${suffix}`;
      if (lastStyles.get(name) === text) return;
      lastStyles.set(name, text); element.style.setProperty(`--avatar-${name}`, text);
    };
    const neutral = () => {
      css('gaze-x', 0, '%'); css('gaze-y', 0, '%'); css('float', 0, 'px'); css('nod', 0, 'px');
      css('blink', 1); css('energy', 0); css('breath', 0.15); css('sweep', 0, '%');
      css('drift', 0, 'px'); css('sway', 0, 'deg'); css('face-lift', 0, 'px'); css('pulse', .5); css('counter-pulse', .5);
      css('face-x', 0, 'px'); css('face-tilt', 0, 'deg'); css('tone', .4); css('eye-open', 1); css('eye-shift', 0, 'px'); css('brow-lift', 0, 'px');
      for (let band = 0; band < 5; band++) css(`wave-${band}`, 0);
      if (mouth) { previousMouth = mouthContour(0, 0, .5); mouth.setAttribute('d', previousMouth); }
      rendered.waves.fill(0);
      Object.assign(rendered, { gazeX: 0, gazeY: 0, level: 0, float: 0, drift: 0, sway: 0, faceLift: 0, faceX: 0, faceTilt: 0, tone: .4, mouthOpen: 0, mouthWidth: 0, mouthRound: .5, eyeOpen: 1, browLift: 0, pulse: .5, counterPulse: .5 });
    };
    const running = () => motionEnabled && !media.matches && document.documentElement.dataset.reduceMotion !== 'true' && !document.hidden && intersecting;
    const update = (now: number) => {
      frame = null;
      if (disposed) return;
      if (!running()) { reconcile(); return; }
      const delta = previous ? Math.min(64, now - previous) : 16;
      previous = now; elapsed += delta;
      if (lastReset !== signals.current.resetToken) {
        lastReset = signals.current.resetToken; pointer = { x: 0, y: 0 }; pendingPointer = null; blinkEnd = null;
        nextBlink = elapsed + 2500 + Math.random() * 3000;
      }
      // Agrupar eventos rápidos del ratón y leer geometría antes de escribir estilos.
      if (pendingPointer && tracks) {
        rect = rig.getBoundingClientRect();
        pointer = gazeFromPointer(pendingPointer.x, pendingPointer.y, rect, radius);
        pendingPointer = null;
      }
      const target = tracks ? signals.current.gaze ?? pointer : { x: 0, y: 0 };
      x = interpolate(x, target.x, delta, responseMs);
      y = interpolate(y, target.y, delta, responseMs);
      const talking = expression === 'listening' || expression === 'speaking';
      const targetLevel = talking ? unit(signals.current.audio ?? audioLevel?.current ?? (textActivity && expression === 'speaking' ? .18 + Math.pow(Math.max(0, Math.sin(elapsed / 115 + Math.sin(elapsed / 430))), 2) * .65 : 0)) : 0;
      level = interpolate(level, targetLevel, delta, targetLevel > level ? 35 : 65);
      const register = (confidenceRef?.current ?? 0) >= .7 ? pitchRef?.current ?? .4 : toneRef?.current ?? .4;
      rendered.tone = interpolate(rendered.tone, talking && level > .02 ? unit(register) : .4, delta, 110);
      const voice = voiceArticulation(level, rendered.tone, bandsRef?.current ?? undefined);
      if (signals.current.blinkAt !== null) { blinkEnd = elapsed + 170; signals.current.blinkAt = null; }
      if (!['thinking', 'success', 'warning', 'sleeping'].includes(expression) && elapsed >= nextBlink) { blinkEnd = elapsed + 170; nextBlink = elapsed + 3200 + Math.random() * 3700; }
      const blinking = blinkEnd !== null && elapsed < blinkEnd;
      const blink = blinking ? 1 - Math.sin((1 - (blinkEnd! - elapsed) / 170) * Math.PI) * 0.96 : 1;
      let nod = 0;
      const nodAt = signals.current.nodAt;
      if (tracks && nodAt !== null) {
        const phase = (now - nodAt) / 650;
        if (phase >= 1) signals.current.nodAt = null;
        else nod = Math.sin(Math.max(0, phase) * Math.PI * 2) * rect.height * .012;
      }
      const pose = ambientMotion(expression, elapsed);
      rendered.gazeX = x; rendered.gazeY = y; rendered.level = level;
      rendered.float = interpolate(rendered.float, pose.y * rect.height - level * rect.height * .003, delta, 85);
      rendered.drift = interpolate(rendered.drift, pose.x * rect.width, delta, 180);
      rendered.sway = interpolate(rendered.sway, pose.tilt, delta, 180);
      const listening = expression === 'listening';
      const facialLift = pose.faceY * rect.height - (listening ? voice.listenLift * rect.height * .018 + level * rect.height * .007 : 0);
      rendered.faceLift = interpolate(rendered.faceLift, facialLift, delta, 90);
      rendered.faceX = interpolate(rendered.faceX, (pose.faceX + (expression === 'acknowledging' ? 0 : x * .002)) * rect.width, delta, 110);
      rendered.faceTilt = interpolate(rendered.faceTilt, expression === 'acknowledging' ? 0 : pose.faceTilt + x * 1.8 + (listening ? voice.listenTilt : 0), delta, 130);
      rendered.mouthOpen = interpolate(rendered.mouthOpen, voice.open, delta, voice.open > rendered.mouthOpen ? 35 : 55);
      rendered.mouthWidth = interpolate(rendered.mouthWidth, voice.width, delta, 60);
      rendered.mouthRound = interpolate(rendered.mouthRound, voice.roundness, delta, 85);
      const eyeBase = expression === 'surprised' ? 1.25 : expression === 'concerned' ? .85 : 1;
      rendered.eyeOpen = interpolate(rendered.eyeOpen, eyeBase + pose.counterPulse * .12 + level * .12, delta, 95);
      rendered.browLift = interpolate(rendered.browLift, -1 - pose.counterPulse * 2.5 - Math.max(0, -y) * 2 - level * rendered.tone * 2, delta, 100);
      for (let band = 0; band < 5; band++) {
        rendered.waves[band] = interpolate(rendered.waves[band], talking && level > .02 ? voice.waves[band] : 0, delta, 60);
        css(`wave-${band}`, rendered.waves[band]);
      }
      rendered.pulse = interpolate(rendered.pulse, pose.pulse, delta, 100);
      rendered.counterPulse = interpolate(rendered.counterPulse, pose.counterPulse, delta, 100);
      css('gaze-x', x * maxX * 100, '%'); css('gaze-y', y * maxY * 100, '%');
      css('float', rendered.float, 'px');
      css('drift', rendered.drift, 'px'); css('sway', rendered.sway, 'deg'); css('face-lift', rendered.faceLift, 'px');
      css('face-x', rendered.faceX, 'px'); css('face-tilt', rendered.faceTilt, 'deg'); css('tone', rendered.tone);
      css('eye-open', rendered.eyeOpen); css('eye-shift', x * 1.2, 'px'); css('brow-lift', rendered.browLift, 'px');
      css('mouth-open', rendered.mouthOpen);
      if (mouth) {
        const contour = mouthContour(rendered.mouthOpen, rendered.mouthWidth, rendered.mouthRound);
        if (contour !== previousMouth) { mouth.setAttribute('d', contour); previousMouth = contour; }
      }
      css('nod', nod, 'px'); css('blink', blink); css('energy', level);
      css('pulse', rendered.pulse); css('counter-pulse', rendered.counterPulse);
      css('breath', .08 + rendered.pulse * .2); css('sweep', (Math.sin(elapsed / 4000) * .5 + .5) * 100, '%');
      frame = requestAnimationFrame(update);
    };
    const reconcile = () => {
      if (!running()) {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null; previous = 0; signals.current.nodAt = null; signals.current.blinkAt = null;
        x = 0; y = 0; level = 0; pointer = { x: 0, y: 0 }; pendingPointer = null;
        element.dataset.running = 'false'; neutral();
      } else if (frame === null) { element.dataset.running = 'true'; previous = 0; frame = requestAnimationFrame(update); }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      signals.current.gaze = null;
      pendingPointer = { x: event.clientX, y: event.clientY };
    };
    const leave = () => { pointer = { x: 0, y: 0 }; pendingPointer = null; signals.current.gaze = null; };
    // La ventana flotante sigue hablando aunque el usuario trabaje en otra app.
    const blur = () => { leave(); };
    const focus = () => { resize(); reconcile(); };
    const resize = () => { rect = rig.getBoundingClientRect(); };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      intersecting = entries[0]?.isIntersecting ?? false; resize(); reconcile();
    });
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    const motionGuard = new MutationObserver(reconcile);
    motionGuard.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] });
    observer?.observe(element); sizes?.observe(element);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    function onPointerOut(event: PointerEvent) { if (!event.relatedTarget) leave(); }
    window.addEventListener('blur', blur); window.addEventListener('focus', focus);
    window.addEventListener('resize', resize); window.addEventListener('scroll', resize, true);
    document.addEventListener('visibilitychange', onVisibility);
    function onVisibility() { leave(); reconcile(); }
    media.addEventListener('change', reconcile);
    reconcile();
    return () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect(); sizes?.disconnect(); motionGuard.disconnect();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
      window.removeEventListener('resize', resize); window.removeEventListener('scroll', resize, true);
      document.removeEventListener('visibilitychange', onVisibility); media.removeEventListener('change', reconcile);
      element.dataset.running = 'false';
    };
  }, [root, signals, expression, audioLevel, toneRef, bandsRef, pitchRef, confidenceRef, motionEnabled, textActivity, maxX, maxY, radius, responseMs]);
  return { root, signals };
}
