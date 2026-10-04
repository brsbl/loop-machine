import { describe, expect, it } from 'vitest'
import { applyCommand } from './commands'
import { CHORDS, PRESETS } from './library'
import { defaultSession } from './schema'
import { createSessionStore } from './store'
import { decodeSession } from './url'

describe('session store undo', () => {
  it('steps back one change at a time', () => {
    const store = createSessionStore(defaultSession())
    expect(store.canUndo()).toBe(false)
    store.dispatch({ type: 'toggleDrumStep', drum: 'kick', step: 0 })
    store.dispatch({ type: 'toggleDrumStep', drum: 'kick', step: 4 })
    store.undo()
    expect(store.getState().drums.kick.steps.filter(Boolean)).toHaveLength(1)
    store.undo()
    expect(store.getState()).toEqual(defaultSession())
    expect(store.canUndo()).toBe(false)
  })

  it('undoes a knob drag in one step, but separate turns separately', () => {
    let t = 0
    const store = createSessionStore(defaultSession(), () => t)
    for (const value of [0.5, 0.4, 0.3]) {
      store.dispatch({ type: 'setDrumParam', drum: 'snare', param: 'volume', value })
      t += 100
    }
    t += 2000
    store.dispatch({ type: 'setDrumParam', drum: 'snare', param: 'volume', value: 0.1 })
    store.undo()
    expect(store.getState().drums.snare.volume).toBe(0.3)
    store.undo()
    expect(store.getState().drums.snare.volume).toBe(defaultSession().drums.snare.volume)
  })

  it('adds no undo step for commands that change nothing', () => {
    const chord = [...CHORDS[0].notes]
    const held = applyCommand(defaultSession(), { type: 'setNotes', notes: chord })
    const store = createSessionStore(applyCommand(held, { type: 'reset' }))
    let changes = 0
    store.subscribe(() => changes++)
    store.dispatch({ type: 'setWaveform', waveform: store.getState().synth.waveform })
    store.dispatch({ type: 'setNotes', notes: chord })
    store.dispatch({ type: 'reset' })
    store.dispatch({ type: 'setBpm', bpm: store.getState().bpm })
    expect(store.canUndo()).toBe(false)
    expect(changes).toBe(0)

    const preset = createSessionStore(decodeSession(PRESETS[0].link))
    preset.dispatch({ type: 'loadSession', session: decodeSession(PRESETS[0].link) })
    expect(preset.canUndo()).toBe(false)
  })
})
