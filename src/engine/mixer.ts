import type { DrumDefinition } from '../instruments'
import { ChannelStrip } from './channel'
import { DelayBus } from './delay'
import { createMixBus } from './drive'
import { Pump } from './pump'
import { createReverbBus } from './reverb'
import { Synth } from './synth'

export interface Mixer {
  channels: Map<string, ChannelStrip>
  echo: DelayBus
  synth: Synth
  pump: Pump
}

/**
 * The whole signal chain, from voices to speakers:
 *
 *   drums → channel strips ─────────────────────┐
 *              └ delay send → echo ───┐         │
 *   synth ────────────────────────────┼→ pump ──┴→ mix bus → limiter → out
 *     └ reverb send → reverb ─────────┘
 *
 * Shared by the live engine and offline renders, so both hear the same thing.
 */
export function buildMixer(ctx: BaseAudioContext, drums: readonly DrumDefinition[]): Mixer {
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -3
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.1
  limiter.connect(ctx.destination)
  const bus = createMixBus(ctx, limiter)
  const pump = new Pump(ctx, bus)
  const reverb = createReverbBus(ctx, pump.input)
  const echo = new DelayBus(ctx, pump.input)
  const channels = new Map(drums.map((d) => [d.id, new ChannelStrip(ctx, bus, echo.input)]))
  return { channels, echo, synth: new Synth(ctx, pump.input, reverb), pump }
}
