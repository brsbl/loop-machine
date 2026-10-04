import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { Engine } from './engine/engine'
import { DRUMS, noteForKey } from './instruments'
import { createSessionStore } from './session/store'
import { readSessionFromLocation, writeSessionToLocation } from './session/url'
import { LoopMachine } from './ui/LoopMachine'
import styles from './App.module.css'

/** Panel width plus its glass border, and the page margin on each side. */
const PANEL_WIDTH = 1128
const PAGE_GUTTER = 48

/** How long the share link may trail the session. Browsers rate-limit address rewrites, and a knob drag changes the session many times a second. */
const LINK_DELAY_MS = 250

export function App() {
  const [store] = useState(() => createSessionStore(readSessionFromLocation()))
  const [engine] = useState(() => new Engine(DRUMS))

  const playhead = useSyncExternalStore(engine.subscribe, engine.getPlayhead)
  const isPlaying = useSyncExternalStore(engine.subscribe, () => engine.isPlaying)

  useEffect(() => {
    engine.apply(store.getState())
    engine.load()
    return () => engine.dispose()
  }, [engine, store])

  // The session drives the engine on every change; the share link catches up once per LINK_DELAY_MS, and before the page goes away.
  useEffect(() => {
    let pending: ReturnType<typeof setTimeout> | undefined
    const writeLink = () => {
      if (pending === undefined) return
      clearTimeout(pending)
      pending = undefined
      writeSessionToLocation(store.getState())
    }
    const unsubscribe = store.subscribe(() => {
      engine.apply(store.getState())
      pending ??= setTimeout(writeLink, LINK_DELAY_MS)
    })
    window.addEventListener('pagehide', writeLink)
    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', writeLink)
      writeLink()
    }
  }, [engine, store])

  // The panel has a fixed hardware layout; scale it down to fit narrower windows, like the prototype in the proposal.
  const [zoom, setZoom] = useState(1)
  useLayoutEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerWidth - PAGE_GUTTER) / PANEL_WIDTH))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Computer keys toggle notes, like clicking the keyboard; ⌘Z / Ctrl+Z undoes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable="true"]')) return
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        store.undo()
        return
      }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const note = noteForKey(e.key)
      if (!note) return
      e.preventDefault()
      store.dispatch({ type: 'toggleNote', note })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [store])

  return (
    <main className={styles.app} style={{ zoom }}>
      <LoopMachine
        store={store}
        playhead={playhead}
        isPlaying={isPlaying}
        onStartStop={() => (engine.isPlaying ? engine.stop() : void engine.start())}
        onReset={() => {
          engine.stop()
          store.dispatch({ type: 'reset' })
        }}
      />
    </main>
  )
}
