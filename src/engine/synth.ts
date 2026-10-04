import type { Waveform } from '../session/schema'
import { drive } from './drive'
import { glide } from './params'

const ENVELOPE = { attack: 0.008, decay: 0.18, sustain: 0.6, release: 0.25 }

/**
 * Supersaw-style unison: seven oscillators detuned up to ±22 cents and spread
 * across the stereo field give the dense, wide tone; a centered sub an octave
 * down gives it weight. Positions run -1 (left) to 1 (right).
 */
const UNISON = [-1, -0.62, -0.3, 0, 0.3, 0.62, 1]
const DETUNE_CENTS = 22
const STEREO_SPREAD = 0.85
const SUB_LEVEL = 0.25

/** A small share of the synth goes to the shared reverb so the arp has some space. */
const REVERB_SEND = 0.18

/** Each note's filter opens to `peak` × the base cutoff and settles back, so notes pluck instead of drone. */
const FILTER = { peak: 3.5, settle: 0.2, resonance: 2.5 }

/** Bright waves get a lower base cutoff so they stay warm under the drive. */
const cutoffFor = (waveform: Waveform): number => (waveform === 'sawtooth' || waveform === 'square' ? 3600 : 6000)

/** The filtered voices are driven after the filter, the gritty French electro way. */
const DRIVE = { amount: 1.8, level: 0.8 }

/** A steep low-pass after the drive shaves off the fizz the saturation adds on top, above the 2–6 kHz presence range. */
const HIGH_CUT = 7000

/**
 * The envelope gain `elapsed` seconds after a note starts, from the same
 * attack and decay segments `noteOn` schedules. Browsers without
 * `cancelAndHoldAtTime` use it to pin the gain where the envelope has reached.
 */
export function envelopeAt(elapsed: number): number {
  const { attack, decay, sustain } = ENVELOPE
  if (elapsed <= 0) return 0
  if (elapsed < attack) return elapsed / attack
  if (elapsed < attack + decay) return 1 - ((1 - sustain) * (elapsed - attack)) / decay
  return sustain
}

export interface Voice {
  /** The unison oscillators, which follow the waveform. */
  unison: OscillatorNode[]
  oscs: OscillatorNode[]
  filter: BiquadFilterNode
  env: GainNode
  /** When the note starts, on the audio clock. */
  start: number
  /** Set once the voice has a release scheduled, so a second release does not restart it. */
  releasedAt?: number
}

/** Arp synth voice: stereo unison + sub → plucked low-pass → ADSR → drive → high cut. Voices start and release at scheduled times. */
export class Synth {
  readonly output: GainNode
  private readonly input: AudioNode
  private waveform: Waveform = 'sawtooth'
  private readonly voices = new Set<Voice>()

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
    reverbInput: AudioNode,
  ) {
    this.output = ctx.createGain()
    // Two 12 dB/octave stages make a 24 dB/octave cut. Web Audio's low-pass Q is in dB; -3 is flat (Butterworth), with no bump before the cut.
    const [cutA, cutB] = [0, 1].map(() => {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = HIGH_CUT
      f.Q.value = -3
      return f
    })
    cutA.connect(cutB).connect(this.output)
    this.input = drive(ctx, cutA, DRIVE.amount, DRIVE.level)
    this.output.connect(destination)
    const send = ctx.createGain()
    send.gain.value = REVERB_SEND
    this.output.connect(send)
    send.connect(reverbInput)
  }

  setVolume(volume: number): void {
    glide(this.output.gain, volume, this.ctx)
  }

  setWaveform(waveform: Waveform): void {
    if (waveform === this.waveform) return
    this.waveform = waveform
    for (const v of this.voices) {
      for (const osc of v.unison) osc.type = waveform
      glide(v.filter.frequency, cutoffFor(waveform), this.ctx)
    }
  }

  noteOn(frequency: number, time: number): Voice {
    const { ctx } = this
    const mix = ctx.createGain()
    mix.gain.value = 1 / Math.sqrt(UNISON.length)

    const unison = UNISON.map((position) => {
      const osc = ctx.createOscillator()
      osc.type = this.waveform
      osc.frequency.setValueAtTime(frequency, time)
      osc.detune.setValueAtTime(position * DETUNE_CENTS, time)
      const pan = ctx.createStereoPanner()
      pan.pan.value = position * STEREO_SPREAD
      osc.connect(pan).connect(mix)
      return osc
    })
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(frequency / 2, time)
    const subLevel = ctx.createGain()
    subLevel.gain.value = SUB_LEVEL
    const oscs = [...unison, sub]

    const base = cutoffFor(this.waveform)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = FILTER.resonance
    filter.frequency.setValueAtTime(base * FILTER.peak, time)
    filter.frequency.exponentialRampToValueAtTime(base, time + FILTER.settle)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(1, time + ENVELOPE.attack)
    env.gain.linearRampToValueAtTime(ENVELOPE.sustain, time + ENVELOPE.attack + ENVELOPE.decay)

    mix.connect(filter)
    sub.connect(subLevel).connect(filter)
    filter.connect(env)
    env.connect(this.input)
    // Each unison oscillator starts a random fraction of a cycle late, so they begin out of phase instead of flanging.
    unison.forEach((o) => o.start(time + Math.random() / frequency))
    sub.start(time)

    const voice: Voice = { unison, oscs, filter, env, start: time }
    this.voices.add(voice)
    oscs[0].onended = () => {
      this.voices.delete(voice)
      env.disconnect()
    }
    return voice
  }

  /** Releases at `time`, the moment the next note starts, not when it was scheduled. */
  release(voice: Voice, time: number): void {
    // An earlier release already covers this one: the decay continues on the same curve.
    if (voice.releasedAt !== undefined && voice.releasedAt <= time) return
    const gain = voice.env.gain
    if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(time)
    else {
      // Without cancelAndHoldAtTime, cancelling drops the in-progress decay ramp and the gain snaps back to 1, so pin it where the envelope has reached.
      gain.cancelScheduledValues(time)
      gain.setValueAtTime(envelopeAt(time - voice.start), time)
    }
    gain.setTargetAtTime(0, time, ENVELOPE.release / 4)
    voice.releasedAt = time
    voice.oscs.forEach((o) => o.stop(time + ENVELOPE.release + 0.05))
  }

  /** Lets sounding notes fade; notes that have not started yet are cancelled outright. */
  releaseAll(): void {
    const now = this.ctx.currentTime
    for (const v of this.voices) {
      if (v.start > now) {
        // Cancelling a gain whose events all lie ahead holds its default of 1, a blip, so stop the voice before it starts instead.
        v.oscs.forEach((o) => o.stop(now))
        v.env.disconnect()
        this.voices.delete(v)
      } else this.release(v, now)
    }
  }
}
