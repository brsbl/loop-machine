import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pad from '../components/Pad'

describe('Pad', () => {
  const defaultProps = {
    active: false,
    playing: false,
    isBeatStart: false,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a button', () => {
    render(<Pad {...defaultProps} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    render(<Pad {...defaultProps} />)
    fireEvent.click(screen.getByRole('button'))
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  it('has active class when active', () => {
    render(<Pad {...defaultProps} active={true} />)
    expect(screen.getByRole('button')).toHaveClass('active')
  })

  it('has playing-step class when playing', () => {
    render(<Pad {...defaultProps} playing={true} />)
    expect(screen.getByRole('button')).toHaveClass('playing-step')
  })

  it('has beat-start class when isBeatStart and not active', () => {
    render(<Pad {...defaultProps} isBeatStart={true} />)
    expect(screen.getByRole('button')).toHaveClass('beat-start')
  })
})
