/**
 * One shared reverb return bus, used by the synth for a little space. The
 * impulse response is generated, so no file is needed.
 */
export function createReverbBus(ctx: BaseAudioContext, destination: AudioNode, seconds = 2.2): GainNode {
  const input = ctx.createGain()
  const convolver = ctx.createConvolver()
  convolver.buffer = makeImpulse(ctx, seconds)
  const ret = ctx.createGain()
  ret.gain.value = 0.9
  input.connect(convolver)
  convolver.connect(ret)
  ret.connect(destination)
  return input
}

function makeImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
    }
  }
  return impulse
}
