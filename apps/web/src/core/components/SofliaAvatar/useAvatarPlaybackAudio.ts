'use client';

import { useEffect, useRef, useState } from 'react';
import { getSharedAudioElement } from '@/core/services/tts/client/ios-audio-unlock';
import { estimateVoicePitch } from './voice-pitch';

interface CapturableAudio extends HTMLAudioElement {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
}

/** Observación de la salida existente: nunca redirige sonido ni captura micrófono. */
export function useAvatarPlaybackAudio(enabled: boolean) {
  const level = useRef(0); const tone = useRef(.4); const pitch = useRef(.4);
  const pitchConfidence = useRef(0); const bands = useRef(new Float32Array(8));
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(false);
    if (!enabled) return;
    const audio = getSharedAudioElement() as CapturableAudio | null;
    const capture = audio?.captureStream ?? audio?.mozCaptureStream;
    if (!audio || !capture || typeof AudioContext === 'undefined') return;
    let stream: MediaStream | undefined; let context: AudioContext | undefined;
    let node: MediaStreamAudioSourceNode | undefined; let analyser: AnalyserNode | undefined;
    let frame = 0; let cancelled = false;
    const clean = () => {
      cancelAnimationFrame(frame); node?.disconnect(); analyser?.disconnect();
      stream?.getTracks().forEach(track => track.stop());
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      level.current = 0; pitchConfidence.current = 0; bands.current.fill(0);
    };
    const start = async () => {
      try {
        stream = capture.call(audio);
        if (!stream.getAudioTracks().length) { clean(); return; }
        context = new AudioContext();
        if (context.state === 'suspended') await context.resume();
        if (cancelled || context.state !== 'running') { clean(); return; }
        node = context.createMediaStreamSource(stream); analyser = context.createAnalyser();
        analyser.fftSize = 2048; node.connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        const spectrum = new Uint8Array(analyser.frequencyBinCount);
        const edges = [20, 60, 250, 500, 1000, 2000, 4000, 8000, 20000];
        let lastPitch = 0;
        const update = (now: number) => {
          if (cancelled || !analyser || !context) return;
          analyser.getByteTimeDomainData(samples); analyser.getByteFrequencyData(spectrum);
          let energy = 0; let spectral = 0; let weighted = 0;
          for (const sample of samples) energy += ((sample - 128) / 128) ** 2;
          const rms = Math.sqrt(energy / samples.length);
          const target = rms > .004 ? Math.min(1, (rms - .004) / .16) : 0;
          level.current += (target - level.current) * (target > level.current ? .45 : .12);
          const hz = context.sampleRate / analyser.fftSize;
          for (let index = 1; index < spectrum.length; index++) { const value = spectrum[index] ** 2; spectral += value; weighted += value * index * hz; }
          if (spectral && target > .01) tone.current = Math.min(1, Math.max(0, Math.log2(Math.max(120, weighted / spectral) / 120) / Math.log2(8000 / 120)));
          for (let band = 0; band < 8; band++) {
            const startBin = Math.max(1, Math.floor(edges[band] / hz)); const endBin = Math.min(spectrum.length, Math.ceil(edges[band + 1] / hz));
            let sum = 0; for (let bin = startBin; bin < endBin; bin++) sum += spectrum[bin] / 255;
            const value = target > .01 ? sum / Math.max(1, endBin - startBin) : 0;
            bands.current[band] += (value - bands.current[band]) * .3;
          }
          if (now - lastPitch >= 50) {
            lastPitch = now; const voice = target > .01 ? estimateVoicePitch(samples, context.sampleRate) : null;
            pitchConfidence.current = voice?.confidence ?? 0;
            if (voice) pitch.current = voice.normalized;
          }
          frame = requestAnimationFrame(update);
        };
        setAvailable(true); frame = requestAnimationFrame(update);
      } catch { clean(); } // Safari sin captureStream conserva el gesto ambiental de conversación.
    };
    void start();
    return () => { cancelled = true; clean(); };
  }, [enabled]);
  return { available, level, features: { tone, pitch, pitchConfidence, bands } };
}
