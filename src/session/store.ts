import { useSyncExternalStore } from 'react'
import { applyCommand, type Command } from './commands'
import type { Session } from './schema'
import { encodeSession } from './url'

export interface SessionStore {
  getState(): Session
  dispatch(command: Command): void
  /** Steps back one change. */
  undo(): void
  canUndo(): boolean
  subscribe(listener: () => void): () => void
}

/** How many changes undo remembers. */
const HISTORY_LIMIT = 100

/** Repeats of the same continuous control within this window count as one change, so a knob drag undoes in one step. */
const COALESCE_MS = 800

/** Commands that come in streams while a control is dragged, keyed by the control they move. */
function continuousKey(command: Command): string | null {
  switch (command.type) {
    case 'setDrumParam':
      return `${command.type}:${command.drum}:${command.param}`
    case 'setSynthVolume':
    case 'setBpm':
      return command.type
    default:
      return null
  }
}

export function createSessionStore(initial: Session, now: () => number = Date.now): SessionStore {
  let state = initial
  let past: Session[] = []
  let last: { key: string; at: number } | null = null
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  return {
    getState: () => state,
    dispatch(command) {
      const next = applyCommand(state, command)
      // The link carries the whole session, so an unchanged link means nothing changed: no undo step, no rewrite.
      if (next === state || encodeSession(next) === encodeSession(state)) return
      const key = continuousKey(command)
      const at = now()
      const continuing = key !== null && last?.key === key && at - last.at < COALESCE_MS
      if (!continuing) past = [...past, state].slice(-HISTORY_LIMIT)
      last = key === null ? null : { key, at }
      state = next
      notify()
    },
    undo() {
      const previous = past.at(-1)
      if (!previous) return
      past = past.slice(0, -1)
      last = null
      state = previous
      notify()
    },
    canUndo: () => past.length > 0,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function useSession<T>(store: SessionStore, select: (s: Session) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(store.getState()))
}
