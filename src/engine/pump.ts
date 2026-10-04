/** How far the pumped parts dip on each kick (-16 dB), how fast, and how they swell back. */
const DUCK = { depth: 0.16, attack: 0.004, hold: 0.02, recover: 0.1 }

/**
 * Sidechain pump: everything sustained (the synth, the delay, and the reverb)
 * runs through here and ducks on every kick, the French house breathing.
 * The drums bypass it so their hits stay intact.
 */
export class Pump {
  readonly input: GainNode

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this.input = ctx.createGain()
    this.input.connect(destination)
  }

  /** Dips at `time`, when a kick lands, then swells back. */
  duck(time: number): void {
    const gain = this.input.gain
    gain.cancelScheduledValues(time)
    gain.setTargetAtTime(DUCK.depth, time, DUCK.attack)
    gain.setTargetAtTime(1, time + DUCK.hold, DUCK.recover)
  }
}
