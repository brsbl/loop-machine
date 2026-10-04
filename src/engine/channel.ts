import { glide } from './params'

/** The DELAY knob at full sends this much to the echo, so repeats sit under the dry hit. */
const MAX_SEND = 0.8

/**
 * The same strip on every drum: volume → output, with a post-fader send to
 * the shared delay.
 */
export class ChannelStrip {
  readonly input: GainNode
  private readonly send: GainNode

  constructor(
    private readonly ctx: BaseAudioContext,
    output: AudioNode,
    delayInput: AudioNode,
  ) {
    this.input = ctx.createGain()
    this.send = ctx.createGain()
    this.send.gain.value = 0
    this.input.connect(output)
    this.input.connect(this.send)
    this.send.connect(delayInput)
  }

  set(volume: number, delay: number): void {
    glide(this.input.gain, volume, this.ctx)
    glide(this.send.gain, delay * MAX_SEND, this.ctx)
  }
}
