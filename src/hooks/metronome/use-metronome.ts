

import { useEffect, useRef, useState } from "react"
import type { Voice } from "../../lib/metronome/metronome-patterns"

interface UseMetronomeOptions {
  bpm: number
  steps: Voice[]
  /** Grid steps per quarter-note pulse (the BPM unit). */
  stepsPerBeat: number
  isPlaying: boolean
  /** Master volume 0..1 */
  volume?: number
}

// Web Audio synthesis for each voice. Returns nothing for rests.
function playVoice(
  ctx: AudioContext,
  destination: GainNode,
  noiseBuffer: AudioBuffer,
  voice: Voice,
  time: number,
) {
  if (voice === "rest") return

  switch (voice) {
    case "dum": {
      // Low, round membrane hit with a quick pitch drop.
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(170, time)
      osc.frequency.exponentialRampToValueAtTime(90, time + 0.12)
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(1, time + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28)
      osc.connect(gain).connect(destination)
      osc.start(time)
      osc.stop(time + 0.3)
      break
    }
    case "tak": {
      // Sharp, bright hit: filtered noise burst + short high tone.
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer
      const bp = ctx.createBiquadFilter()
      bp.type = "bandpass"
      bp.frequency.setValueAtTime(2600, time)
      bp.Q.value = 1.4
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.9, time)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
      src.connect(bp).connect(gain).connect(destination)
      src.start(time)
      src.stop(time + 0.07)

      const osc = ctx.createOscillator()
      const og = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(880, time)
      og.gain.setValueAtTime(0.4, time)
      og.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
      osc.connect(og).connect(destination)
      osc.start(time)
      osc.stop(time + 0.06)
      break
    }
    default: {
      // Western clicks: accent > beat > sub, differing in pitch and level.
      const freq = voice === "accent" ? 1600 : voice === "beat" ? 1000 : 760
      const level = voice === "accent" ? 1 : voice === "beat" ? 0.7 : 0.32
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(level, time + 0.002)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
      osc.connect(gain).connect(destination)
      osc.start(time)
      osc.stop(time + 0.06)
    }
  }
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 0.2)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/**
 * Sample-accurate metronome scheduler built on the Web Audio API using the
 * classic look-ahead technique. Returns the currently sounding step index so
 * the UI can highlight it (or -1 when stopped).
 */
export function useMetronome({ bpm, steps, stepsPerBeat, isPlaying, volume = 0.9 }: UseMetronomeOptions) {
  const [currentStep, setCurrentStep] = useState(-1)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const noiseRef = useRef<AudioBuffer | null>(null)

  // Live values consumed inside the scheduler loop.
  const bpmRef = useRef(bpm)
  const stepsRef = useRef(steps)
  const stepsPerBeatRef = useRef(stepsPerBeat)
  const volumeRef = useRef(volume)

  bpmRef.current = bpm
  stepsRef.current = steps
  stepsPerBeatRef.current = stepsPerBeat
  volumeRef.current = volume

  // Keep master gain in sync with volume without restarting playback.
  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.02)
    }
  }, [volume])

  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(-1)
      return
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx()
      const master = ctxRef.current.createGain()
      master.gain.value = volumeRef.current
      master.connect(ctxRef.current.destination)
      masterRef.current = master
      noiseRef.current = createNoiseBuffer(ctxRef.current)
    }

    const ctx = ctxRef.current
    const master = masterRef.current!
    const noise = noiseRef.current!
    void ctx.resume()

    const LOOKAHEAD_MS = 25
    const SCHEDULE_AHEAD = 0.12

    let stepIndex = 0
    let nextNoteTime = ctx.currentTime + 0.06
    const queue: { step: number; time: number }[] = []

    const secondsPerStep = () => 60 / bpmRef.current / stepsPerBeatRef.current

    const schedulerId = window.setInterval(() => {
      while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
        const len = stepsRef.current.length || 1
        const step = stepIndex % len
        playVoice(ctx, master, noise, stepsRef.current[step] ?? "rest", nextNoteTime)
        queue.push({ step, time: nextNoteTime })
        nextNoteTime += secondsPerStep()
        stepIndex = (stepIndex + 1) % len
      }
    }, LOOKAHEAD_MS)

    let rafId = 0
    const draw = () => {
      const now = ctx.currentTime
      while (queue.length && queue[0].time <= now) {
        setCurrentStep(queue.shift()!.step)
      }
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)

    return () => {
      window.clearInterval(schedulerId)
      cancelAnimationFrame(rafId)
      setCurrentStep(-1)
    }
  }, [isPlaying])

  return { currentStep }
}
