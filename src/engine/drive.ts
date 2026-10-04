/**
 * Saturation for the kick, snare, and synth, and the mix bus they share. The
 * grit is aimed at dirty French electro, but placed: highs (the hi-hat) and the
 * full mix stay clean, so it reads as drive rather than a crushed lo-fi file.
 */

const curves = new Map<number, Float32Array<ArrayBuffer>>()

/** A tanh curve normalized to ±1; higher `amount` drives harder. Cached per amount. */
export function saturationCurve(amount: number): Float32Array<ArrayBuffer> {
  let curve = curves.get(amount)
  if (!curve) {
    const n = 2048
    curve = new Float32Array(new ArrayBuffer(n * 4))
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1
      curve[i] = Math.tanh(amount * x) / Math.tanh(amount)
    }
    curves.set(amount, curve)
  }
  return curve
}

/** A saturator feeding `out`: connect sources to the returned node. */
export function drive(ctx: BaseAudioContext, out: AudioNode, amount: number, level = 1): WaveShaperNode {
  const shaper = ctx.createWaveShaper()
  shaper.curve = saturationCurve(amount)
  shaper.oversample = '4x'
  if (level === 1) {
    shaper.connect(out)
  } else {
    const trim = ctx.createGain()
    trim.gain.value = level
    shaper.connect(trim).connect(out)
  }
  return shaper
}

/** Mix level into the limiter, leaving headroom so the limiter only catches stray peaks instead of squashing every kick. */
const HEADROOM = 0.6

/**
 * Mix bus: a gentle glue compressor into `destination`. Its slow attack lets
 * each drum hit punch through before it clamps. Returns the bus input.
 */
export function createMixBus(ctx: BaseAudioContext, destination: AudioNode): GainNode {
  const input = ctx.createGain()
  const trim = ctx.createGain()
  trim.gain.value = HEADROOM
  const glue = ctx.createDynamicsCompressor()
  glue.threshold.value = -14
  glue.knee.value = 8
  glue.ratio.value = 2.5
  glue.attack.value = 0.015
  glue.release.value = 0.2
  input.connect(glue).connect(trim).connect(destination)
  return input
}
