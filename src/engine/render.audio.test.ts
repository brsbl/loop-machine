import { describe, expect, it } from 'vitest'
import { DRUMS, noteByName } from '../instruments'
import { PRESETS } from '../session/library'
import type { Session } from '../session/schema'
import { decodeSession } from '../session/url'
import { arpIndex, arpPlaysOnStep } from './arpeggiator'
import { stepSeconds } from './clock'
import { playDrum, type DrumVoice } from './drums'
import { buildMixer } from './mixer'
import { Synth } from './synth'

const SAMPLE_RATE = 44100

const peakOf = (samples: Float32Array) => samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0)
const rmsDb = (samples: Float32Array) => 10 * Math.log10(samples.reduce((sum, s) => sum + s * s, 0) / samples.length)
const slice = (buffer: AudioBuffer, from: number, to: number) => buffer.getChannelData(0).subarray(Math.floor(from * SAMPLE_RATE), Math.floor(to * SAMPLE_RATE))

/**
 * Renders `bars` of a session through the real mixer, scheduling steps the way
 * the engine does: drums per step (kicks duck the pump), arp notes on the gate grid.
 */
async function renderSession(session: Session, bars = 2): Promise<AudioBuffer> {
  const step = stepSeconds(session.bpm)
  const ctx = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * (bars * 16 * step + 1)), SAMPLE_RATE)
  const mixer = buildMixer(ctx, DRUMS)
  for (const d of DRUMS) mixer.channels.get(d.id)!.set(session.drums[d.id].volume, session.drums[d.id].delay)
  mixer.synth.setVolume(session.synth.volume)
  mixer.synth.setWaveform(session.synth.waveform)
  mixer.echo.setStepSeconds(step)

  const { synth } = session
  let last: ReturnType<typeof mixer.synth.noteOn> | null = null
  let count = 0
  for (let n = 0; n < bars * 16; n++) {
    const time = 0.05 + n * step
    const i = n % 16
    for (const d of DRUMS) {
      if (!session.drums[d.id].steps[i]) continue
      playDrum(d.voice, ctx, mixer.channels.get(d.id)!.input, time, session.drums[d.id].decay)
      if (d.voice === 'kick') mixer.pump.duck(time)
    }
    if (arpPlaysOnStep(i, synth.steps[i], synth.rate) && synth.notes.length > 0) {
      const note = noteByName(synth.notes[arpIndex(synth.mode, count++, synth.notes.length)])!
      if (last) mixer.synth.release(last, time)
      last = mixer.synth.noteOn(note.freq * 2 ** synth.octave, time)
    }
  }
  return ctx.startRendering()
}

async function renderHit(voice: DrumVoice, seconds = 1): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, SAMPLE_RATE * seconds, SAMPLE_RATE)
  playDrum(voice, ctx, ctx.destination, 0)
  return (await ctx.startRendering()).getChannelData(0)
}

describe('ready-made loops', () => {
  for (const preset of PRESETS) {
    it(`${preset.name} renders audible, finite, and below clipping`, async () => {
      const buffer = await renderSession(decodeSession(preset.link))
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const samples = buffer.getChannelData(ch)
        expect(samples.every(Number.isFinite)).toBe(true)
        expect(peakOf(samples)).toBeLessThan(1)
        expect(rmsDb(samples)).toBeGreaterThan(-30)
      }
    })
  }
})

describe('drum voices', () => {
  it.each([
    ['kick', 0.5],
    ['snare', 0.3],
    ['hihat', 0.1],
  ] as const)('%s sounds', async (voice, minPeak) => {
    expect(peakOf(await renderHit(voice))).toBeGreaterThan(minPeak)
  })

  it('a new kick chokes the last one, like the 808', async () => {
    const ctx = new OfflineAudioContext(1, SAMPLE_RATE * 1.5, SAMPLE_RATE)
    const out = ctx.createGain()
    out.connect(ctx.destination)
    playDrum('kick', ctx, out, 0, 1)
    playDrum('kick', ctx, out, 0.5, 1)
    const both = await ctx.startRendering()

    const solo = new OfflineAudioContext(1, SAMPLE_RATE * 1.5, SAMPLE_RATE)
    playDrum('kick', solo, solo.destination, 0.5, 1)
    const second = await solo.startRendering()

    // Once the second kick lands, only it should be sounding.
    const after = slice(both, 0.6, 1.2)
    const secondOnly = slice(second, 0.6, 1.2)
    const leftover = after.map((s, i) => s - secondOnly[i])
    expect(rmsDb(leftover)).toBeLessThan(-60)
  })
})

describe('synth', () => {
  it('falls silent after a released note', async () => {
    // The synth on its own: the mixer's reverb would still ring after the note ends.
    const ctx = new OfflineAudioContext(2, SAMPLE_RATE * 1.5, SAMPLE_RATE)
    const synth = new Synth(ctx, ctx.destination, ctx.createGain())
    synth.setVolume(0.7)
    const voice = synth.noteOn(noteByName('A3')!.freq, 0.05)
    synth.release(voice, 0.5)
    const buffer = await ctx.startRendering()
    expect(rmsDb(slice(buffer, 0.1, 0.4))).toBeGreaterThan(-30)
    expect(rmsDb(slice(buffer, 1.0, 1.5))).toBeLessThan(-60)
  })
})

describe('delay', () => {
  it('echoes a dotted eighth after the hit', async () => {
    const bpm = 120
    const ctx = new OfflineAudioContext(2, SAMPLE_RATE * 1.2, SAMPLE_RATE)
    const mixer = buildMixer(ctx, DRUMS)
    mixer.echo.setStepSeconds(stepSeconds(bpm))
    // Straight into the delay, so only the echo reaches the output.
    playDrum('snare', ctx, mixer.echo.input, 0.05, 0.25)
    const buffer = await ctx.startRendering()

    const echoAt = 0.05 + 3 * stepSeconds(bpm) // three sixteenths = 0.375 s
    expect(peakOf(slice(buffer, 0, echoAt - 0.02))).toBeLessThan(0.01)
    expect(peakOf(slice(buffer, echoAt, echoAt + 0.06))).toBeGreaterThan(0.02)
  })
})
