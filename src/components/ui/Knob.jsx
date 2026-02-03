import { memo, useCallback, useRef, useEffect } from 'react'
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

  // Render at 2x for crisp display on retina screens
  const scale = 2
  const viewSize = size * scale
  const strokeWidth = 18

  // Arc path calculation for the value indicator
  // Outer stroke: radius is inner edge, so add half stroke width
  const innerRadius = (viewSize - 32) / 2
  const radius = innerRadius + strokeWidth / 2
  const centerX = viewSize / 2
  const centerY = viewSize / 2

  // Calculate arc angles to match background track rotation (135 degrees)
  // Background track starts at 135° (bottom-left) and spans 270° to 45° (bottom-right)
  const startAngle = 135 * (Math.PI / 180)
  const endAngle = (135 + normalized * 270) * (Math.PI / 180)

  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY + radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY + radius * Math.sin(endAngle)

  // largeArc flag should be 1 when arc exceeds 180 degrees
  // For a 270 degree span, 180/270 = 0.6667 (2/3)
  const largeArc = normalized > 2 / 3 ? 1 : 0

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragStartRef.current = {
      y: e.clientY,
      value: value,
    }

    const handleMouseMove = (e) => {
      if (!dragStartRef.current) return

      const deltaY = dragStartRef.current.y - e.clientY
      const sensitivity = range / 150 // 150px drag = full range
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

  // Use useEffect to attach wheel listener with { passive: false }
  // React 18 uses passive listeners by default, making e.preventDefault() ineffective
  useEffect(() => {
    const knob = knobRef.current
    if (!knob) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -step : step
      const newValue = Math.min(max, Math.max(min, value + delta * 5))
      onChange(Math.round(newValue / step) * step)
    }

    knob.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      knob.removeEventListener('wheel', handleWheel)
    }
  }, [value, min, max, step, onChange])

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className="knob"
        onMouseDown={handleMouseDown}
        style={{ width: size, height: size }}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        tabIndex={0}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          {/* Clip path for outer stroke effect */}
          <defs>
            <clipPath id={`knob-clip-${size}`}>
              <circle cx={centerX} cy={centerY} r={innerRadius + strokeWidth} />
            </clipPath>
          </defs>

          {/* Background track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#3a3a3a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${radius * Math.PI * 1.5} ${radius * Math.PI * 2}`}
            transform={`rotate(135 ${centerX} ${centerY})`}
            clipPath={`url(#knob-clip-${size})`}
          />

          {/* Value arc */}
          {normalized > 0 && (
            <path
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
              fill="none"
              stroke="#f5a623"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              clipPath={`url(#knob-clip-${size})`}
            />
          )}

          {/* Center dot / indicator */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - 6}
            fill="#2a2a2a"
          />

          {/* Indicator line */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + (innerRadius - 16) * Math.cos(endAngle)}
            y2={centerY + (innerRadius - 16) * Math.sin(endAngle)}
            stroke="#f5a623"
            strokeWidth="6"
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
