/** Seconds a parameter takes to settle, so knob moves glide instead of clicking. */
export const SMOOTHING = 0.015

export function glide(param: AudioParam, value: number, ctx: BaseAudioContext): void {
  param.setTargetAtTime(value, ctx.currentTime, SMOOTHING)
}
