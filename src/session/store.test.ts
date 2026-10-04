import { describe, expect, it } from 'vitest'
import { defaultSession } from './schema'
import { createSessionStore } from './store'

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
})
