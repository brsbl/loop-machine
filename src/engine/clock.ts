import { STEPS } from '../session/schema'

/** How far ahead notes are scheduled, and how often the scheduler wakes up. */
export const LOOKAHEAD = 0.1
export const TICK_MS = 25

export const stepSeconds = (bpm: number): number => 60 / bpm / 4

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
    const horizon = this.ctx.currentTime + LOOKAHEAD
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
