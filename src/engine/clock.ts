import { STEPS } from '../session/schema'

/** How far ahead notes are scheduled, and how often the scheduler wakes up. */
export const LOOKAHEAD = 0.1
export const TICK_MS = 25

export const stepSeconds = (bpm: number): number => 60 / bpm / 4

/**
 * Where the grid resumes when the scheduler wakes up late (the main thread
 * stalled). Steps whose time has already passed are skipped, not played
 * stacked on top of each other in the past: a stall leaves a gap.
 */
export function catchUp(step: number, nextTime: number, now: number, secondsPerStep: number): { step: number; nextTime: number } {
  if (nextTime >= now) return { step, nextTime }
  const missed = Math.ceil((now - nextTime) / secondsPerStep)
  return { step: (step + missed) % STEPS, nextTime: nextTime + missed * secondsPerStep }
}

/**
 * Lookahead scheduler. A Worker drives the tick so playback stays steady when
 * the tab is in the background, where main-thread timers are throttled.
 */
export class Clock {
  private step = 0
  private nextTime = 0
  private ticker: { stop(): void } | null = null

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly secondsPerStep: () => number,
    private readonly onStep: (step: number, time: number) => void,
  ) {}

  get running(): boolean {
    return this.ticker !== null
  }

  start(): void {
    if (this.ticker) return
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.05
    this.tick()
    this.ticker = startTicker(this.tick)
  }

  stop(): void {
    this.ticker?.stop()
    this.ticker = null
  }

  private readonly tick = (): void => {
    const now = this.ctx.currentTime
    const resumed = catchUp(this.step, this.nextTime, now, this.secondsPerStep())
    this.step = resumed.step
    this.nextTime = resumed.nextTime
    const horizon = now + LOOKAHEAD
    while (this.nextTime < horizon) {
      this.onStep(this.step, this.nextTime)
      this.nextTime += this.secondsPerStep()
      this.step = (this.step + 1) % STEPS
    }
  }
}

function startTicker(tick: () => void): { stop(): void } {
  if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
    try {
      const url = URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${TICK_MS})`], { type: 'text/javascript' }))
      const worker = new Worker(url)
      worker.onmessage = tick
      return {
        stop() {
          // A message already queued must not tick a stopped clock.
          worker.onmessage = null
          worker.terminate()
          URL.revokeObjectURL(url)
        },
      }
    } catch {
      // Fall through to a main-thread timer.
    }
  }
  const id = setInterval(tick, TICK_MS)
  return { stop: () => clearInterval(id) }
}
