import { afterEach, describe, expect, it, vi } from 'vitest'
import { catchUp, Clock, LOOKAHEAD, TICK_MS } from './clock'

const SPS = 0.125

describe('catchUp', () => {
  it('leaves an on-time grid alone', () => {
    expect(catchUp(3, 1.2, 1, SPS)).toEqual({ step: 3, nextTime: 1.2 })
    expect(catchUp(3, 1, 1, SPS)).toEqual({ step: 3, nextTime: 1 })
  })

  it('skips the steps that have already passed and lands on the next grid point', () => {
    const { step, nextTime } = catchUp(2, 1, 1.3, SPS)
    expect(step).toBe(5) // 1.0, 1.125, 1.25 passed; the grid resumes at 1.375
    expect(nextTime).toBeCloseTo(1.375)
  })

  it('wraps the step around the pattern', () => {
    expect(catchUp(15, 0, 0.2, SPS).step).toBe(1)
    expect(catchUp(0, 0, 100, SPS).step).toBe(Math.ceil(100 / SPS) % 16)
  })
})

describe('Clock', () => {
  afterEach(() => vi.useRealTimers())

  it('leaves a gap, not stacked hits, after the main thread stalls', () => {
    vi.useFakeTimers()
    const ctx = { currentTime: 0 }
    const hits: Array<{ step: number; time: number }> = []
    const clock = new Clock(ctx as BaseAudioContext, () => SPS, (step, time) => hits.push({ step, time }))

    clock.start()
    expect(hits.map((h) => h.step)).toEqual([0])

    ctx.currentTime = 10
    hits.length = 0
    vi.advanceTimersByTime(TICK_MS)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(Math.ceil(LOOKAHEAD / SPS) + 1)
    expect(hits.every((h) => h.time >= 10)).toBe(true)
    // The skipped steps keep the pattern on the grid: step n sounds at n × SPS + 0.05 (mod the pattern).
    for (const h of hits) expect(h.step).toBe(Math.round((h.time - 0.05) / SPS) % 16)

    clock.stop()
  })

  it('stops ticking once stopped', () => {
    vi.useFakeTimers()
    const ctx = { currentTime: 0 }
    const onStep = vi.fn()
    const clock = new Clock(ctx as BaseAudioContext, () => SPS, onStep)
    clock.start()
    clock.stop()
    expect(clock.running).toBe(false)
    onStep.mockClear()
    ctx.currentTime = 5
    vi.advanceTimersByTime(TICK_MS * 4)
    expect(onStep).not.toHaveBeenCalled()
  })
})
