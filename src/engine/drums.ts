import { drive } from './drive'

/**
 * Synthesized drum voices in the dirty French electro style: an 808 kick,
 * a 909 snare, and a disco open hat; the kick and snare are driven. No samples:
 * every hit is built from oscillators and noise at its scheduled time, then
 * sent through the drum's channel strip (volume, delay send). Each voice
 * takes a `length` multiplier from its DECAY knob that stretches its tail. Levels peak around kick 0.95, snare 0.85, and
 * hi-hat 0.4 before the channel volume.
 */

export type DrumVoice = 'kick' | 'snare' | 'hihat'

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

/** One second of white noise per context, reused by every hit. */
function noise(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

function noiseSource(ctx: BaseAudioContext, time: number, duration: number): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx)
  src.loop = true
  src.start(time, Math.random() * 0.5)
  src.stop(time + duration)
  return src
}

/** Exponential decay envelope from `peak` to silence over `decay` seconds. */
function envelope(ctx: BaseAudioContext, time: number, peak: number, decay: number, attack = 0.001): GainNode {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, time)
  g.gain.exponentialRampToValueAtTime(peak, time + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay)
  return g
}

/**
 * A gain into `out` that the next hit in the same group cuts off at its start
 * time, like the 808's kick or a hi-hat pedal closing an open hat.
 */
function choked(ctx: BaseAudioContext, out: AudioNode, time: number, group: WeakMap<AudioNode, GainNode>): GainNode {
  group.get(out)?.gain.setTargetAtTime(0, time, 0.008)
  const gain = ctx.createGain()
  gain.connect(out)
  group.set(out, gain)
  return gain
}

const lastKick = new WeakMap<AudioNode, GainNode>()
const lastHat = new WeakMap<AudioNode, GainNode>()

/**
 * 808 kick: a sine that drops 110 → 52 Hz in 50 ms, then sags toward 45 Hz
 * over a long boom. On top, a 909-style snap (a sine sweeping 3.5 kHz → 160 Hz
 * in 25 ms) and a noise tick give the attack its punch. Light saturation adds
 * harmonics so the low end carries on small speakers without losing its roundness.
 */
function kick(ctx: BaseAudioContext, out: AudioNode, time: number, length: number): void {
  const dirt = drive(ctx, choked(ctx, out, time, lastKick), 2.5, 0.95)

  const body = ctx.createOscillator()
  body.frequency.setValueAtTime(110, time)
  body.frequency.exponentialRampToValueAtTime(52, time + 0.05)
  body.frequency.exponentialRampToValueAtTime(45, time + 1.2 * length)
  body.connect(envelope(ctx, time, 0.95, 1.5 * length, 0.002)).connect(dirt)
  body.start(time)
  body.stop(time + 1.5 * length + 0.1)

  const snap = ctx.createOscillator()
  snap.frequency.setValueAtTime(3500, time)
  snap.frequency.exponentialRampToValueAtTime(160, time + 0.025)
  snap.connect(envelope(ctx, time, 0.5, 0.03, 0.0005)).connect(dirt)
  snap.start(time)
  snap.stop(time + 0.06)

  const click = noiseSource(ctx, time, 0.01)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2500
  click.connect(bp).connect(envelope(ctx, time, 0.25, 0.006)).connect(dirt)
}

/** Two low pitched shells under a thick noise snap, driven for a crunchy hit. */
function snare(ctx: BaseAudioContext, out: AudioNode, time: number, length: number): void {
  const dirt = drive(ctx, out, 2.2, 0.75)

  for (const [start, end, level] of [
    [200, 160, 0.35],
    [330, 280, 0.18],
  ]) {
    const shell = ctx.createOscillator()
    shell.type = 'triangle'
    shell.frequency.setValueAtTime(start, time)
    shell.frequency.exponentialRampToValueAtTime(end, time + 0.05)
    shell.connect(envelope(ctx, time, level, 0.15 * length)).connect(dirt)
    shell.start(time)
    shell.stop(time + 0.15 * length + 0.1)
  }

  const snap = noiseSource(ctx, time, 0.28 * length + 0.07)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  const peak = ctx.createBiquadFilter()
  peak.type = 'peaking'
  peak.frequency.value = 3500
  peak.gain.value = 5
  snap.connect(hp).connect(peak).connect(envelope(ctx, time, 0.45, 0.28 * length)).connect(dirt)
}

/**
 * Disco open hat: six detuned square waves at inharmonic ratios for the metal,
 * plus noise for sizzle, band-passed high with a long "tsss" tail. The next
 * hat closes it, so it opens fully on the off-beats and stays crisp in busy patterns.
 */
const HAT_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]

function hihat(ctx: BaseAudioContext, out: AudioNode, time: number, length: number): void {
  const mix = ctx.createGain()
  mix.gain.value = 0.45
  for (const ratio of HAT_RATIOS) {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 40 * ratio
    osc.connect(mix)
    osc.start(time)
    osc.stop(time + 0.6 * length + 0.1)
  }
  const air = noiseSource(ctx, time, 0.6 * length + 0.1)
  const airLevel = ctx.createGain()
  airLevel.gain.value = 0.7
  air.connect(airLevel).connect(mix)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 9500
  bp.Q.value = 0.7
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000
  // Left clean: driving the hat's highs only adds grain.
  mix.connect(bp).connect(hp).connect(envelope(ctx, time, 0.75, 0.6 * length, 0.002)).connect(choked(ctx, out, time, lastHat))
}

type Voice = (ctx: BaseAudioContext, out: AudioNode, time: number, length: number) => void

const VOICES: Record<DrumVoice, Voice> = { kick, snare, hihat }

/** DECAY 0–1 to a tail multiplier: ¼× (tight, a closed hat) through 1× at center to 4× (long, a washy open hat). */
export const decayLength = (decay: number): number => 2 ** (4 * decay - 2)

export function playDrum(voice: DrumVoice, ctx: BaseAudioContext, out: AudioNode, time: number, decay = 0.5): void {
  VOICES[voice](ctx, out, time, decayLength(decay))
}
