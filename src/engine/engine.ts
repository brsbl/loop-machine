import { noteByName, type DrumDefinition } from '../instruments'
import type { Session } from '../session/schema'
import { arpIndex, arpPlaysOnStep } from './arpeggiator'
import { playDrum } from './drums'
import { Clock, stepSeconds } from './clock'
import { buildMixer, type Mixer } from './mixer'
import type { Voice } from './synth'

/** What the UI shows while playing: the step under the playhead and the synth note fired on it. */
export interface Playhead {
  step: number
  note: string | null
}

export const STOPPED: Playhead = { step: -1, note: null }

interface Graph extends Mixer {
  ctx: AudioContext
  clock: Clock
}

type Listener = () => void

/**
 * The audio engine. It has no UI dependencies: callers hand it a session and
 * read the playhead back. Scheduling runs ahead on the audio clock; the
 * playhead is published when each step actually sounds.
 */
export class Engine {
  private graph: Graph | null = null
  private session: Session | null = null
  private playhead: Playhead = STOPPED
  private pending: Array<{ time: number } & Playhead> = []
  private frame = 0
  private arpCount = 0
  private lastVoice: Voice | null = null
  private readonly listeners = new Set<Listener>()

  constructor(private readonly drums: readonly DrumDefinition[]) {}

  /** Creates the audio graph. Safe to call again after `dispose`. */
  load(): void {
    if (this.graph) return
    const ctx = new AudioContext()
    const graph: Graph = {
      ctx,
      ...buildMixer(ctx, this.drums),
      clock: new Clock(ctx, () => stepSeconds(this.session?.bpm ?? 120), this.scheduleStep),
    }
    this.graph = graph
    if (this.session) this.applyParams(this.session)
  }

  dispose(): void {
    this.stop()
    void this.graph?.ctx.close()
    this.graph = null
  }

  /** Called on every session change; knob values glide to their new settings. */
  apply(session: Session): void {
    this.session = session
    if (this.graph) this.applyParams(session)
  }

  get isPlaying(): boolean {
    return this.graph?.clock.running ?? false
  }

  getPlayhead = (): Playhead => this.playhead

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async start(): Promise<void> {
    const g = this.graph
    if (!g || g.clock.running) return
    if (g.ctx.state === 'suspended') await g.ctx.resume()
    this.arpCount = 0
    g.clock.start()
    this.frame = requestAnimationFrame(this.publish)
    this.emit()
  }

  stop(): void {
    const g = this.graph
    if (!g) return
    g.clock.stop()
    g.synth.releaseAll()
    this.lastVoice = null
    this.pending = []
    cancelAnimationFrame(this.frame)
    this.playhead = STOPPED
    this.emit()
  }

  private applyParams(session: Session): void {
    const g = this.graph!
    for (const [id, strip] of g.channels) {
      const t = session.drums[id]
      if (t) strip.set(t.volume, t.delay)
    }
    g.echo.setStepSeconds(stepSeconds(session.bpm))
    g.synth.setVolume(session.synth.volume)
    g.synth.setWaveform(session.synth.waveform)
  }

  private readonly scheduleStep = (step: number, time: number): void => {
    const g = this.graph
    const s = this.session
    if (!g || !s) return

    for (const drum of this.drums) {
      const strip = g.channels.get(drum.id)
      const track = s.drums[drum.id]
      if (!track?.steps[step] || !strip) continue
      playDrum(drum.voice, g.ctx, strip.input, time, track.decay)
      if (drum.voice === 'kick') g.pump.duck(time)
    }

    let note: string | null = null
    const { synth } = s
    // With every key let go, the last note ends on this step instead of droning on.
    if (synth.notes.length === 0 && this.lastVoice) {
      g.synth.release(this.lastVoice, time)
      this.lastVoice = null
    }
    if (arpPlaysOnStep(step, synth.steps[step], synth.rate) && synth.notes.length > 0) {
      note = synth.notes[arpIndex(synth.mode, this.arpCount, synth.notes.length)]
      const def = noteByName(note)
      if (def) {
        if (this.lastVoice) g.synth.release(this.lastVoice, time)
        this.lastVoice = g.synth.noteOn(def.freq * 2 ** synth.octave, time)
        this.arpCount++
      }
    }
    this.pending.push({ time, step, note })
  }

  private readonly publish = (): void => {
    const g = this.graph
    if (!g) return
    const now = g.ctx.currentTime
    let next: Playhead | null = null
    while (this.pending.length && this.pending[0].time <= now) {
      const { step, note } = this.pending.shift()!
      next = { step, note }
    }
    if (next) {
      this.playhead = next
      this.emit()
    }
    this.frame = requestAnimationFrame(this.publish)
  }

  private emit(): void {
    this.listeners.forEach((l) => l())
  }
}
