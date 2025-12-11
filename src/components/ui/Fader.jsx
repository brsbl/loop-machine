import { memo, useCallback, useRef } from 'react'

/**
 * Horizontal fader component with tick marks and draggable thumb
 * Matches hardware mixer/synth fader aesthetic
 */
const Fader = memo(function Fader({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}) {
  const trackRef = useRef(null)
  const dragStartRef = useRef(null)

  const range = max - min
  const normalized = (value - min) / range

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()

    dragStartRef.current = {
      trackLeft: rect.left,
      trackWidth: rect.width,
    }

    // Set initial value based on click position
    const clickX = e.clientX - rect.left
    const newNormalized = Math.max(0, Math.min(1, clickX / rect.width))
    const newValue = min + newNormalized * range
    const snapped = Math.round(newValue / step) * step
    onChange(Math.max(min, Math.min(max, snapped)))

    const handleMouseMove = (e) => {
      if (!dragStartRef.current) return

      const { trackLeft, trackWidth } = dragStartRef.current
      const currentX = e.clientX - trackLeft
      const newNormalized = Math.max(0, Math.min(1, currentX / trackWidth))
      const newValue = min + newNormalized * range
      const snapped = Math.round(newValue / step) * step
      onChange(Math.max(min, Math.min(max, snapped)))
    }

    const handleMouseUp = () => {
      dragStartRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [min, max, range, step, onChange])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()
    const touch = e.touches[0]

    dragStartRef.current = {
      trackLeft: rect.left,
      trackWidth: rect.width,
    }

    const touchX = touch.clientX - rect.left
    const newNormalized = Math.max(0, Math.min(1, touchX / rect.width))
    const newValue = min + newNormalized * range
    const snapped = Math.round(newValue / step) * step
    onChange(Math.max(min, Math.min(max, snapped)))

    const handleTouchMove = (e) => {
      if (!dragStartRef.current) return
      const touch = e.touches[0]

      const { trackLeft, trackWidth } = dragStartRef.current
      const currentX = touch.clientX - trackLeft
      const newNormalized = Math.max(0, Math.min(1, currentX / trackWidth))
      const newValue = min + newNormalized * range
      const snapped = Math.round(newValue / step) * step
      onChange(Math.max(min, Math.min(max, snapped)))
    }

    const handleTouchEnd = () => {
      dragStartRef.current = null
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [min, max, range, step, onChange])

  return (
    <div className="fader-container">
      <div className="fader-wrapper">
        {/* Single tick line above */}
        <div className="fader-tick-line fader-tick-top" />

        {/* Track */}
        <div
          ref={trackRef}
          className="fader-track"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          tabIndex={0}
        >
          {/* Thumb */}
          <div
            className="fader-thumb"
            style={{ left: `${normalized * 100}%` }}
          >
            <div className="fader-thumb-grip">
              <div className="fader-thumb-indicator" />
            </div>
          </div>
        </div>

        {/* Single tick line below */}
        <div className="fader-tick-line fader-tick-bottom" />
      </div>
    </div>
  )
})

export default Fader
