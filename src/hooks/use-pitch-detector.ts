import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "@/lib/pitch-detection";

// A window of raw per-frame readings is kept and smoothed before it ever
// reaches the UI. This is what makes the tuner feel calm instead of
// twitchy: a single noisy or octave-jumped frame gets outvoted by its
// neighbors instead of flashing on screen.
const HISTORY_SIZE = 9; // ~150ms of readings at 60fps
const MIN_VOICED_FRAMES = 5; // majority of the window must have a pitch to report one
const UPDATE_EVERY_N_FRAMES = 4; // commit a smoothed value ~15 times/sec instead of 60

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function usePitchDetector() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<(number | null)[]>([]);
  const frameCountRef = useRef(0);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    const ctx = audioCtxRef.current;

    if (analyser && buffer && ctx) {
      analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);
      const raw = detectPitch(buffer, ctx.sampleRate);

      const history = historyRef.current;
      history.push(raw);
      if (history.length > HISTORY_SIZE) history.shift();

      frameCountRef.current++;
      if (frameCountRef.current >= UPDATE_EVERY_N_FRAMES) {
        frameCountRef.current = 0;
        const voiced = history.filter((v): v is number => v !== null);
        setFrequency(voiced.length >= MIN_VOICED_FRAMES ? median(voiced) : null);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    historyRef.current = [];
    frameCountRef.current = 0;
    setIsListening(false);
    setFrequency(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      bufferRef.current = new Float32Array(analyser.fftSize);
      historyRef.current = [];
      frameCountRef.current = 0;

      setIsListening(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Microphone access was denied or is unavailable.");
    }
  }, [tick]);

  // Release the mic if the component unmounts while listening.
  useEffect(() => stop, [stop]);

  return { frequency, isListening, error, start, stop };
}
