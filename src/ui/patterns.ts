import { PRESETS } from '../session/library'
import type { Session } from '../session/schema'
import { encodeSession } from '../session/url'

/** The ready-made loops as LED keys numbered 1–6. */
export const PATTERN_OPTIONS = PRESETS.map((p, i) => ({ value: p.link, content: String(i + 1), name: p.name }))

/** The ready-made loop the session exactly matches, if any; changing anything makes it your own. */
export const presetFor = (session: Session) => {
  const link = encodeSession(session)
  return PRESETS.find((p) => p.link === link)
}
