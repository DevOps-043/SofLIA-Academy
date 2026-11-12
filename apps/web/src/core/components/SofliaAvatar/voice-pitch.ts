/** Estimación acotada de frecuencia fundamental; reutiliza la ventana del analizador. */
export function estimateVoicePitch(samples: Uint8Array, sampleRate: number): { normalized: number; confidence: number; hz: number } {
  const empty = { normalized: .4, confidence: 0, hz: 0 };
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || samples.length < 256) return empty;
  const step = Math.max(1, Math.round(sampleRate / 12000));
  const size = Math.floor(samples.length / step);
  const rate = sampleRate / step;
  // Detectar también picos agudos fuera de rango evita confundirlos con su octava inferior.
  const lowLag = Math.max(2, Math.floor(rate / 1200));
  const highLag = Math.min(Math.ceil(rate / 80), Math.floor(size / 2) - 1);
  if (highLag <= lowLag + 2) return empty;
  const wave = new Float32Array(size);
  let mean = 0;
  for (let index = 0; index < size; index++) {
    let sum = 0;
    for (let offset = 0; offset < step; offset++) sum += (samples[index * step + offset] - 128) / 128;
    wave[index] = sum / step; mean += wave[index];
  }
  mean /= size;
  let energy = 0;
  for (let index = 0; index < size; index++) { wave[index] -= mean; energy += wave[index] * wave[index]; }
  if (energy / size < .000025) return empty;
  const correlations = new Float32Array(highLag + 2);
  const window = size - highLag - 1;
  let strongest = 0;
  for (let lag = lowLag; lag <= highLag; lag++) {
    let dot = 0; let first = 0; let second = 0;
    for (let index = 0; index < window; index++) {
      const a = wave[index]; const b = wave[index + lag];
      dot += a * b; first += a * a; second += b * b;
    }
    correlations[lag] = dot / Math.sqrt(Math.max(1e-12, first * second));
    strongest = Math.max(strongest, correlations[lag]);
  }
  if (strongest < .7) return empty;
  for (let lag = lowLag + 1; lag < highLag; lag++) {
    const peak = correlations[lag];
    if (peak < Math.max(.7, strongest * .94) || peak < correlations[lag - 1] || peak < correlations[lag + 1]) continue;
    const curve = correlations[lag - 1] - 2 * peak + correlations[lag + 1];
    const correction = Math.abs(curve) > 1e-6 ? .5 * (correlations[lag - 1] - correlations[lag + 1]) / curve : 0;
    const hz = rate / (lag + Math.max(-.5, Math.min(.5, correction)));
    if (hz < 80 || hz > 650) return empty;
    return { hz, confidence: Math.max(0, Math.min(1, peak)), normalized: Math.max(0, Math.min(1, Math.log2(hz / 80) / Math.log2(650 / 80))) };
  }
  return empty;
}
