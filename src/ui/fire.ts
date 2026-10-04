import type { CSSProperties } from 'react'
import type { FireColor } from '../instruments'

/** A row's firing color as the CSS variables its step keys read. */
export const fireVars = (c: FireColor) => ({ '--fire-top': c.top, '--fire-bottom': c.bottom, '--fire-glow': c.glow }) as CSSProperties
