/**
 * Estimates the fundamental frequency of a time-domain audio buffer using
 * autocorrelation (ACF2+ with parabolic interpolation). Returns null when
 * the signal is too quiet or no clear periodicity is found.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): number | null {
  const size = buffer.length;

  const rms = Math.sqrt(buffer.reduce((sum, v) => sum + v * v, 0) / size);
  if (rms < 0.02) return null; // effectively silent / ambient noise floor

  // Trim leading/trailing near-silence so the autocorrelation window is centered on signal.
  const threshold = 0.2;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) >= threshold) {
      start = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) >= threshold) {
      end = size - i;
      break;
    }
  }
  const trimmed = buffer.slice(start, end);
  const n = trimmed.length;
  if (n < 8) return null;

  const correlation = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += trimmed[i] * trimmed[i + lag];
    }
    correlation[lag] = sum;
  }

  // Skip the initial downward slope from lag 0 (always the highest peak).
  let d = 0;
  while (d < n - 1 && correlation[d] > correlation[d + 1]) d++;

  let maxValue = -Infinity;
  let maxLag = -1;
  for (let lag = d; lag < n; lag++) {
    if (correlation[lag] > maxValue) {
      maxValue = correlation[lag];
      maxLag = lag;
    }
  }
  if (maxLag <= 0) return null;

  // Parabolic interpolation around the peak for sub-sample precision.
  const x1 = correlation[maxLag - 1] ?? correlation[maxLag];
  const x2 = correlation[maxLag];
  const x3 = correlation[maxLag + 1] ?? correlation[maxLag];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const refinedLag = a ? maxLag - b / (2 * a) : maxLag;

  if (refinedLag <= 0) return null;
  const frequency = sampleRate / refinedLag;

  // Violin-relevant range guard (below the G string, above stratospheric harmonics).
  if (frequency < 70 || frequency > 4000) return null;
  return frequency;
}
