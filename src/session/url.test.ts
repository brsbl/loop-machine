import { describe, expect, it } from 'vitest'
import { applyCommand } from './commands'
import { defaultSession } from './schema'
import { decodeSession, encodeSession } from './url'

describe('share link', () => {
  it('round-trips drums, tempo, and the full synth', () => {
    let s = defaultSession()
    s = applyCommand(s, { type: 'setBpm', bpm: 98 })
    s = applyCommand(s, { type: 'toggleDrumStep', drum: 'kick', step: 0 })
    s = applyCommand(s, { type: 'toggleDrumStep', drum: 'kick', step: 10 })
    s = applyCommand(s, { type: 'setDrumParam', drum: 'snare', param: 'delay', value: 0.4 })
    s = applyCommand(s, { type: 'toggleSynthStep', step: 3 })
    s = applyCommand(s, { type: 'toggleNote', note: 'G4' })
    s = applyCommand(s, { type: 'toggleNote', note: 'C3' })
    s = applyCommand(s, { type: 'setArpMode', mode: 'up-down' })
    s = applyCommand(s, { type: 'setArpRate', rate: '1/8' })
    s = applyCommand(s, { type: 'setWaveform', waveform: 'triangle' })
    s = applyCommand(s, { type: 'setOctave', octave: -1 })
    s = applyCommand(s, { type: 'setSynthVolume', value: 0.25 })

    const back = decodeSession(encodeSession(s))

    expect(back.bpm).toBe(98)
    expect(back.drums.kick.steps[0]).toBe(true)
    expect(back.drums.kick.steps[10]).toBe(true)
    expect(back.drums.kick.steps.filter(Boolean)).toHaveLength(2)
    expect(back.drums.snare.delay).toBeCloseTo(0.4, 2)
    expect(back.synth.steps[3]).toBe(true)
    expect(back.synth.notes).toEqual(['C3', 'G4'])
    expect(back.synth.mode).toBe('up-down')
    expect(back.synth.rate).toBe('1/8')
    expect(back.synth.waveform).toBe('triangle')
    expect(back.synth.octave).toBe(-1)
    expect(back.synth.volume).toBeCloseTo(0.25, 2)
  })

  it('keys drums by id, so their order in the link does not matter', () => {
    const link = '2~120~kick.8000.ff00ff~hihat.0001.8000ff~syn.0000.000000.u.16.s.80'
    const s = decodeSession(link)
    expect(s.drums.kick.steps[0]).toBe(true)
    expect(s.drums.hihat.steps[15]).toBe(true)
  })

  it('reads links made before the octave field as octave 0', () => {
    const s = decodeSession('2~120~syn.8000.000800.u.16.s.80')
    expect(s.synth.steps[0]).toBe(true)
    expect(s.synth.octave).toBe(0)
  })

  it('ignores drum ids that would reach the object prototype', () => {
    const s = decodeSession('2~120~__proto__.ffff.ffffff~constructor.ffff.ffffff~kick.8000.ff00ff')
    expect(({} as Record<string, unknown>).steps).toBeUndefined()
    expect(Object.keys(s.drums)).toEqual(Object.keys(defaultSession().drums))
    expect(s.drums.kick.steps[0]).toBe(true)
  })

  it('falls back to defaults for missing, unknown, or malformed parts', () => {
    expect(decodeSession(null)).toEqual(defaultSession())
    expect(decodeSession('8888080880a2_cc0000cc3300cc00ff_098')).toEqual(defaultSession())
    const s = decodeSession('2~999~cowbell.ffff.ffffff~snare.zz.qq~syn.ffff.zz.x.3.w.zz')
    expect(s.bpm).toBe(200)
    expect(s.drums.snare).toEqual(defaultSession().drums.snare)
    expect(s.synth.steps.every(Boolean)).toBe(true)
    expect(s.synth.notes).toEqual([])
    expect(s.synth.mode).toBe('up')
  })
})
