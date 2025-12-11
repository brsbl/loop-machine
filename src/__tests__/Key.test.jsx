import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Key from '../components/Key'

describe('Key', () => {
  const defaultProps = {
    note: 'C3',
    type: 'white',
    isHeld: false,
    isPlaying: false,
    keyHint: 'a',
    onToggle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with correct classes for white key', () => {
    render(<Key {...defaultProps} />)
    const key = screen.getByText('a').closest('.key')
    expect(key).toHaveClass('key', 'white')
  })

  it('renders with correct classes for black key', () => {
    render(<Key {...defaultProps} type="black" />)
    const key = screen.getByText('a').closest('.key')
    expect(key).toHaveClass('key', 'black')
  })

  it('has held class when isHeld', () => {
    render(<Key {...defaultProps} isHeld={true} />)
    const key = screen.getByText('a').closest('.key')
    expect(key).toHaveClass('held')
  })

  it('has playing class when isPlaying', () => {
    render(<Key {...defaultProps} isPlaying={true} />)
    const key = screen.getByText('a').closest('.key')
    expect(key).toHaveClass('playing')
  })

  it('displays key hint', () => {
    render(<Key {...defaultProps} />)
    expect(screen.getByText('a')).toBeInTheDocument()
  })

  it('does not display hint when keyHint is null', () => {
    render(<Key {...defaultProps} keyHint={null} />)
    expect(screen.queryByText('a')).not.toBeInTheDocument()
  })

  it('calls onToggle on click', () => {
    render(<Key {...defaultProps} />)
    const key = screen.getByText('a').closest('.key')
    fireEvent.click(key)
    expect(defaultProps.onToggle).toHaveBeenCalledWith('C3')
  })

  it('has data-note attribute', () => {
    render(<Key {...defaultProps} />)
    const key = screen.getByText('a').closest('.key')
    expect(key).toHaveAttribute('data-note', 'C3')
  })
})
