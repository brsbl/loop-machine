import { render, screen, fireEvent } from '@testing-library/react'
import TransportControls from '../components/TransportControls'

describe('TransportControls', () => {
  const defaultProps = {
    bpm: 120,
    isPlaying: false,
    isLoading: false,
    onPlayStop: jest.fn(),
    onReset: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders tempo value', () => {
    render(<TransportControls {...defaultProps} />)
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('renders TEMPO label', () => {
    render(<TransportControls {...defaultProps} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('shows Start button when not playing', () => {
    render(<TransportControls {...defaultProps} />)
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('shows Stop button when playing', () => {
    render(<TransportControls {...defaultProps} isPlaying={true} />)
    expect(screen.getByText('Stop')).toBeInTheDocument()
  })

  it('calls onPlayStop when Start/Stop button is clicked', () => {
    render(<TransportControls {...defaultProps} />)
    fireEvent.click(screen.getByText('Start'))
    expect(defaultProps.onPlayStop).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when Reset button is clicked', () => {
    render(<TransportControls {...defaultProps} />)
    fireEvent.click(screen.getByText('Reset'))
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1)
  })

  it('disables Start/Stop button when loading', () => {
    render(<TransportControls {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Start')).toBeDisabled()
  })
})
