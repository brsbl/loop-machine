import { glide } from './params'

/** Echo time in sixteenth steps: three is a dotted eighth, the classic disco and French house delay. */
const ECHO_STEPS = 3

/** Each echo is this share of the one before, and the band the repeats are squeezed into so they darken as they fade. */
const FEEDBACK = 0.5
const BAND = { low: 250, high: 3200 }

/**
 * One shared tempo-synced ping-pong echo. Each drum's DELAY knob sets how much
 * it sends here; repeats bounce left, right, left… into `destination`.
 */
export class DelayBus {
  readonly input: GainNode
  private readonly left: DelayNode
  private readonly right: DelayNode

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    this.input = ctx.createGain()
    this.left = ctx.createDelay(2)
    this.right = ctx.createDelay(2)
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = BAND.low
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = BAND.high
    const bounce = ctx.createGain()
    bounce.gain.value = FEEDBACK
    const feedback = ctx.createGain()
    feedback.gain.value = FEEDBACK
    const stereo = ctx.createChannelMerger(2)

    this.input.connect(this.left)
    this.left.connect(highpass).connect(lowpass)
    lowpass.connect(stereo, 0, 0)
    lowpass.connect(bounce).connect(this.right)
    this.right.connect(stereo, 0, 1)
    this.right.connect(feedback).connect(this.left)
    stereo.connect(destination)
  }

  /** Keeps the echo on the beat when the tempo changes. */
  setStepSeconds(seconds: number): void {
    glide(this.left.delayTime, seconds * ECHO_STEPS, this.ctx)
    glide(this.right.delayTime, seconds * ECHO_STEPS, this.ctx)
  }
}
