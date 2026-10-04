import { describe, expect, it } from 'vitest'
import { applyCommand } from './commands'
import { DEFAULT_GATE } from './library'
import { defaultSession } from './schema'

describe('session commands', () => {
  it('reset clears steps but keeps held notes, knobs, and tempo', () => {
    let s = defaultSession()
    s = applyCommand(s, { type: 'toggleDrumStep', drum: 'snare', step: 4 })
    s = applyCommand(s, { type: 'toggleSynthStep', step: 0 })
    s = applyCommand(s, { type: 'toggleNote', note: 'E4' })
    s = applyCommand(s, { type: 'setDrumParam', drum: 'snare', param: 'volume', value: 0.3 })
    s = applyCommand(s, { type: 'setBpm', bpm: 90 })

    const r = applyCommand(s, { type: 'reset' })

    expect(r.drums.snare.steps.some(Boolean)).toBe(false)
    expect(r.synth.steps.some(Boolean)).toBe(false)
    expect(r.synth.notes).toEqual(['E4'])
    expect(r.drums.snare.volume).toBe(0.3)
    expect(r.bpm).toBe(90)
  })

  it('keeps held notes in pitch order and toggles them off', () => {
    let s = defaultSession()
    for (const note of ['G4', 'C4', 'E4']) s = applyCommand(s, { type: 'toggleNote', note })
    expect(s.synth.notes).toEqual(['C4', 'E4', 'G4'])
    s = applyCommand(s, { type: 'toggleNote', note: 'C4' })
    expect(s.synth.notes).toEqual(['E4', 'G4'])
  })

  it('clamps tempo and knob values', () => {
    let s = defaultSession()
    s = applyCommand(s, { type: 'setBpm', bpm: 10 })
    expect(s.bpm).toBe(60)
    s = applyCommand(s, { type: 'setBpm', bpm: 500 })
    expect(s.bpm).toBe(200)
    s = applyCommand(s, { type: 'setDrumParam', drum: 'kick', param: 'decay', value: 3 })
    expect(s.drums.kick.decay).toBe(1)
  })

  it('fills in a synth rhythm when the first key is held with no steps set', () => {
    let s = applyCommand(defaultSession(), { type: 'toggleNote', note: 'C4' })
    expect(s.synth.steps).toEqual([...DEFAULT_GATE])
    s = applyCommand(s, { type: 'toggleSynthStep', step: 0 })
    s = applyCommand(s, { type: 'setNotes', notes: ['A3', 'C4'] })
    expect(s.synth.steps[0]).toBe(!DEFAULT_GATE[0])
  })

  it('leaves your synth steps alone when you already set some', () => {
    let s = applyCommand(defaultSession(), { type: 'toggleSynthStep', step: 3 })
    s = applyCommand(s, { type: 'setNotes', notes: ['G4', 'E4'] })
    expect(s.synth.notes).toEqual(['E4', 'G4'])
    expect(s.synth.steps.filter(Boolean)).toHaveLength(1)
  })

  it('loads a whole session', () => {
    const s = defaultSession()
    const other = { ...defaultSession(), bpm: 140 }
    expect(applyCommand(s, { type: 'loadSession', session: other })).toBe(other)
  })

  it('ignores drums that are not in the session', () => {
    const s = defaultSession()
    expect(applyCommand(s, { type: 'toggleDrumStep', drum: 'cowbell', step: 0 })).toBe(s)
  })
})
