import { useRef, useEffect, memo } from 'react'

const AudioVisualizer = memo(function AudioVisualizer({ analyser, barCount = 16 }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const dataArrayRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')

    // Create data array for frequency data
    if (analyser) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
    }

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateCanvasSize()

    // Watch for container resize
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(container)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Clear canvas
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, width, height)

      const barSpacing = 3
      const barWidth = Math.max(3, (width - (barCount - 1) * barSpacing) / barCount)

      if (analyser && dataArrayRef.current) {
        analyser.getByteFrequencyData(dataArrayRef.current)

        for (let i = 0; i < barCount; i++) {
          // Sample from different parts of the frequency spectrum
          const dataIndex = Math.floor((i / barCount) * (dataArrayRef.current.length / 2))
          const value = dataArrayRef.current[dataIndex] || 0
          const barHeight = Math.max(2, (value / 255) * (height - 8))

          const x = i * (barWidth + barSpacing)
          const y = height - barHeight - 4

          // Orange gradient
          const gradient = ctx.createLinearGradient(0, y, 0, height)
          gradient.addColorStop(0, '#f5a623')
          gradient.addColorStop(1, '#e08a00')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.roundRect(x, y, barWidth, barHeight, 2)
          ctx.fill()
        }
      } else {
        // Draw idle bars when no analyser
        for (let i = 0; i < barCount; i++) {
          const barHeight = 4
          const x = i * (barWidth + barSpacing)
          const y = height - barHeight - 4

          ctx.fillStyle = '#3a3a3a'
          ctx.beginPath()
          ctx.roundRect(x, y, barWidth, barHeight, 2)
          ctx.fill()
        }
      }
    }

    draw()

    return () => {
      resizeObserver.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, barCount])

  return (
    <div className="audio-visualizer" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  )
})

export default AudioVisualizer
