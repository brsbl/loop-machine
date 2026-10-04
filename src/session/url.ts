import { DRUMS, NOTES } from '../instruments'
import { PRESETS } from './library'
import {
  ARP_MODES,
  ARP_RATES,
  OCTAVES,
  STEPS,
  WAVEFORMS,
  clamp01,
  clampBpm,
  defaultSession,
  normalizeNotes,
  type ArpMode,
  type ArpRate,
  type Session,
  type Waveform,
} from './schema'

/**
 * Share-link format, version 2. Every part is keyed, so adding a drum never
 * changes how existing parts read:
 *
 *   ?s=2~<bpm>~<drum>~…~syn.<steps>.<notes>.<mode>.<rate>.<wave>.<vol>.<octave>
 *   drum = <id>.<steps>.<volume><delay><decay>
 *
 * steps: 16 bits as 4 hex · notes: 24 bits as 6 hex · knob values: 0–255 as 2 hex.
 * octave: -1, 0, or 1; links from before it existed omit it and play at 0.
 */
export const LINK_VERSION = '2'

const MODE_CODES: Record<ArpMode, string> = { up: 'u', down: 'd', 'up-down': 'b' }
const RATE_CODES: Record<ArpRate, string> = { '1/4': '4', '1/8': '8', '1/16': '16' }
const WAVE_CODES: Record<Waveform, string> = { sawtooth: 's', square: 'q', sine: 'i', triangle: 't' }

const invert = <K extends string>(m: Record<K, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>
const MODE_BY_CODE = invert(MODE_CODES)
const RATE_BY_CODE = invert(RATE_CODES)
const WAVE_BY_CODE = invert(WAVE_CODES)

const bitsToHex = (bits: boolean[], width: number) =>
  bits.reduce((n, on, i) => (on ? n | (1 << (bits.length - 1 - i)) : n), 0).toString(16).padStart(width, '0')

function hexToBits(hex: string | undefined, length: number): boolean[] | null {
  if (!hex || !/^[0-9a-f]+$/i.test(hex) || hex.length * 4 < length) return null
  const n = parseInt(hex, 16)
  return Array.from({ length }, (_, i) => (n & (1 << (length - 1 - i))) !== 0)
}

const byteHex = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')

function hexByte(hex: string | undefined): number | null {
  if (!hex || !/^[0-9a-f]{2}$/i.test(hex)) return null
  return parseInt(hex, 16) / 255
}

export function encodeSession(session: Session): string {
  const drums = DRUMS.map(({ id }) => {
    const t = session.drums[id]
    return `${id}.${bitsToHex(t.steps, 4)}.${byteHex(t.volume)}${byteHex(t.delay)}${byteHex(t.decay)}`
  })
  const s = session.synth
  const held = new Set(s.notes)
  const synth = [
    'syn',
    bitsToHex(s.steps, 4),
    bitsToHex(NOTES.map((n) => held.has(n.note)), 6),
    MODE_CODES[s.mode],
    RATE_CODES[s.rate],
    WAVE_CODES[s.waveform],
    byteHex(s.volume),
    String(s.octave),
  ].join('.')
  return [LINK_VERSION, String(session.bpm), ...drums, synth].join('~')
}

/**
 * Links from the previous app: `<steps>_<knobs>[_<bpm>]`, 4 hex of steps and
 * 6 hex of knobs (volume, reverb, filter) per drum, in this drum order.
 */
const V1_LINK = /^([0-9a-f]{12})_([0-9a-f]{18})(?:_(\d{1,3}))?$/i
const V1_DRUMS = ['hihat', 'snare', 'kick']

/** Keeps old shared beats playing: their steps, volumes, and tempo carry over. Reverb and filter have no equivalent and stay at defaults. */
function decodeV1(match: RegExpExecArray): Session {
  const session = defaultSession()
  const [, steps, knobs, bpm] = match
  V1_DRUMS.forEach((id, i) => {
    if (!Object.hasOwn(session.drums, id)) return
    const track = session.drums[id]
    track.steps = hexToBits(steps.slice(i * 4, i * 4 + 4), STEPS) ?? track.steps
    track.volume = hexByte(knobs.slice(i * 6, i * 6 + 2)) ?? track.volume
  })
  if (bpm) session.bpm = clampBpm(Number(bpm))
  return session
}

/** Reads a share-link payload. Anything missing or malformed falls back to the default for that part. */
export function decodeSession(payload: string | null): Session {
  const session = defaultSession()
  if (!payload) return session
  const v1 = V1_LINK.exec(payload)
  if (v1) return decodeV1(v1)
  const [version, bpm, ...parts] = payload.split('~')
  if (version !== LINK_VERSION) return session

  session.bpm = clampBpm(Number(bpm))
  for (const part of parts) {
    const [id, ...fields] = part.split('.')
    if (id === 'syn') {
      const [steps, notes, mode, rate, wave, volume, octave] = fields
      const s = session.synth
      s.steps = hexToBits(steps, STEPS) ?? s.steps
      const noteBits = hexToBits(notes, NOTES.length)
      if (noteBits) s.notes = normalizeNotes(NOTES.filter((_, i) => noteBits[i]).map((n) => n.note))
      s.mode = ARP_MODES.includes(MODE_BY_CODE[mode]) ? MODE_BY_CODE[mode] : s.mode
      s.rate = ARP_RATES.includes(RATE_BY_CODE[rate]) ? RATE_BY_CODE[rate] : s.rate
      s.waveform = WAVEFORMS.includes(WAVE_BY_CODE[wave]) ? WAVE_BY_CODE[wave] : s.waveform
      s.volume = hexByte(volume) ?? s.volume
      s.octave = OCTAVES.find((o) => String(o) === octave) ?? s.octave
      continue
    }
    // Only real drum ids: a link naming "__proto__" or "constructor" must not reach Object.prototype.
    if (!Object.hasOwn(session.drums, id)) continue
    const track = session.drums[id]
    const [steps, knobs = ''] = fields
    track.steps = hexToBits(steps, STEPS) ?? track.steps
    track.volume = hexByte(knobs.slice(0, 2)) ?? track.volume
    track.delay = hexByte(knobs.slice(2, 4)) ?? track.delay
    track.decay = hexByte(knobs.slice(4, 6)) ?? track.decay
  }
  return session
}

/** The session in the address bar, or the first ready-made pattern when there is no link, so the machine opens on a groove. */
export const readSessionFromLocation = (): Session =>
  decodeSession(new URLSearchParams(window.location.search).get('s') ?? PRESETS[0].link)

export function writeSessionToLocation(session: Session): void {
  window.history.replaceState(null, '', `${window.location.pathname}?s=${encodeSession(session)}`)
}
