import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TransportControls from '../components/TransportControls'

describe('TransportControls', () => {
  const defaultProps = {
    bpm: 120,
    isPlaying: false,
    isLoading: false,
    onPlayStop: vi.fn(),
    onReset: vi.fn(),
    onBpmChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tempo input with correct value', () => {
    render(<TransportControls {...defaultProps} />)
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(120)
  })

  it('renders TEMPO label', () => {
    render(<TransportControls {...defaultProps} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('shows START button when not playing', () => {
    render(<TransportControls {...defaultProps} />)
    expect(screen.getByText('START')).toBeInTheDocument()
  })

  it('shows STOP button when playing', () => {
    render(<TransportControls {...defaultProps} isPlaying={true} />)
    expect(screen.getByText('STOP')).toBeInTheDocument()
  })

  it('calls onPlayStop when Start/Stop button is clicked', () => {
    render(<TransportControls {...defaultProps} />)
    fireEvent.click(screen.getByText('START'))
    expect(defaultProps.onPlayStop).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when Reset button is clicked', () => {
    render(<TransportControls {...defaultProps} />)
    fireEvent.click(screen.getByText('RESET'))
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1)
  })

  it('disables Start/Stop button when loading', () => {
    render(<TransportControls {...defaultProps} isLoading={true} />)
    expect(screen.getByText('START')).toBeDisabled()
  })

  describe('tempo input', () => {
    it('allows typing new BPM value', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '90' } })
      expect(input).toHaveValue(90)
    })

    it('calls onBpmChange on blur with valid value', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '140' } })
      fireEvent.blur(input)

      expect(defaultProps.onBpmChange).toHaveBeenCalledWith(140)
    })

    it('calls onBpmChange on Enter key', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '100' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      // Enter triggers blur which calls onBpmChange
      fireEvent.blur(input)

      expect(defaultProps.onBpmChange).toHaveBeenCalledWith(100)
    })

    it('resets to current BPM if value is below minimum (60)', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '30' } })
      fireEvent.blur(input)

      expect(defaultProps.onBpmChange).not.toHaveBeenCalled()
      expect(input).toHaveValue(120) // Reset to original
    })

    it('resets to current BPM if value is above maximum (200)', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '250' } })
      fireEvent.blur(input)

      expect(defaultProps.onBpmChange).not.toHaveBeenCalled()
      expect(input).toHaveValue(120) // Reset to original
    })

    it('resets to current BPM if value is not a number', () => {
      render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)

      expect(defaultProps.onBpmChange).not.toHaveBeenCalled()
      expect(input).toHaveValue(120) // Reset to original
    })

    it('syncs with external BPM changes', () => {
      const { rerender } = render(<TransportControls {...defaultProps} />)
      const input = screen.getByRole('spinbutton')

      expect(input).toHaveValue(120)

      rerender(<TransportControls {...defaultProps} bpm={85} />)
      expect(input).toHaveValue(85)
    })
  })
})
