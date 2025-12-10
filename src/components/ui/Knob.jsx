import { memo, useCallback, useRef } from 'react'
import * as Label from '@radix-ui/react-label'

const Knob = memo(function Knob({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  size = 48,
}) {
  const knobRef = useRef(null)
  const dragStartRef = useRef(null)

  // Convert value to angle (0-270 degrees, starting from bottom-left)
  const range = max - min
  const normalized = (value - min) / range
  const angle = normalized * 270 - 135 // -135 to 135 degrees

  // Arc path calculation for the value indicator
  const radius = (size - 8) / 2
  const centerX = size / 2
  const centerY = size / 2

  // Calculate arc endpoint
  const startAngle = -135 * (Math.PI / 180)
  const endAngle = angle * (Math.PI / 180)

  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)

  const largeArc = normalized > 0.5 ? 1 : 0

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragStartRef.current = {
      y: e.clientY,
      value: value,
    }

    const handleMouseMove = (e) => {
      if (!dragStartRef.current) return

      const deltaY = dragStartRef.current.y - e.clientY
      const sensitivity = range / 50 // 50px drag = full range
      const newValue = Math.min(max, Math.max(min,
        dragStartRef.current.value + deltaY * sensitivity
      ))

      // Snap to step
      const snapped = Math.round(newValue / step) * step
      onChange(snapped)
    }

    const handleMouseUp = () => {
      dragStartRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [value, min, max, range, step, onChange])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -step : step
    const newValue = Math.min(max, Math.max(min, value + delta * 5))
    onChange(Math.round(newValue / step) * step)
  }, [value, min, max, step, onChange])

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className="knob"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ width: size, height: size }}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        tabIndex={0}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#3a3a3a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI * 1.5} ${radius * Math.PI * 2}`}
            transform={`rotate(135 ${centerX} ${centerY})`}
          />

          {/* Value arc */}
          {normalized > 0 && (
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
              fill="none"
              stroke="#f5a623"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {/* Center dot / indicator */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - 8}
            fill="#2a2a2a"
          />

          {/* Indicator line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + (radius - 12) * Math.cos(endAngle)}
            y2={centerY + (radius - 12) * Math.sin(endAngle)}
            stroke="#f5a623"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {label && (
        <Label.Root className="knob-label">
          {label}
        </Label.Root>
      )}
    </div>
  )
})

export default Knob
