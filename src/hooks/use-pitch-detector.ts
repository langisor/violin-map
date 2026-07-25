import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "@/lib/pitch-detection";

export function usePitchDetector() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    const ctx = audioCtxRef.current;
    if (analyser && buffer && ctx) {
      analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);
      setFrequency(detectPitch(buffer, ctx.sampleRate));
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
