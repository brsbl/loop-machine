import { jest } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAudioEngine } from '../hooks/useAudioEngine'

// Mock Web Audio API
const mockGainNode = {
  gain: { value: 1, setValueAtTime: jest.fn() },
  connect: jest.fn(),
}

const mockDelayNode = {
  delayTime: { value: 0 },
  connect: jest.fn(),
}

const mockFilterNode = {
  type: 'lowpass',
  frequency: { value: 20000, setValueAtTime: jest.fn() },
  Q: { value: 1 },
  connect: jest.fn(),
}

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
}

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  createGain: jest.fn(() => ({ ...mockGainNode, gain: { ...mockGainNode.gain, setValueAtTime: jest.fn() } })),
  createDelay: jest.fn(() => ({ ...mockDelayNode })),
  createBiquadFilter: jest.fn(() => ({ ...mockFilterNode, frequency: { ...mockFilterNode.frequency, setValueAtTime: jest.fn() } })),
  createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
  decodeAudioData: jest.fn(() => Promise.resolve({})),
  resume: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
}

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
)

// Mock AudioContext
global.AudioContext = jest.fn(() => mockAudioContext)
global.webkitAudioContext = jest.fn(() => mockAudioContext)

describe('useAudioEngine', () => {
  const mockInstruments = [
    { id: 'kick', name: 'Kick', path: '/samples/kick.wav' },
    { id: 'snare', name: 'Snare', path: '/samples/snare.wav' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockAudioContext.state = 'running'
    mockAudioContext.currentTime = 0
  })

  describe('initialization', () => {
    it('creates AudioContext on mount', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled()
      })
    })

    it('creates effect nodes for each instrument', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        // Each instrument needs: mainGain, reverbGain, outputGain, lowpassFilter, delay1, delay2, feedback
        // That's 3 gains + 2 delays + 1 filter per instrument = 6 nodes per instrument
        expect(mockAudioContext.createGain).toHaveBeenCalled()
        expect(mockAudioContext.createDelay).toHaveBeenCalled()
        expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled()
      })
    })

    it('starts with isLoading true', () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))
      expect(result.current.isLoading).toBe(true)
    })

    it('sets isLoading to false after loading', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('fetches audio files for each instrument', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/samples/kick.wav')
        expect(global.fetch).toHaveBeenCalledWith('/samples/snare.wav')
      })
    })
  })

  describe('playSound', () => {
    it('does not play when muted', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.playSound('kick', 0, { muted: true })
      })

      expect(mockBufferSource.start).not.toHaveBeenCalled()
    })
  })

  describe('resumeContext', () => {
    it('resumes suspended audio context', async () => {
      mockAudioContext.state = 'suspended'
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.resumeContext()
      })

      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('does not resume running audio context', async () => {
      mockAudioContext.state = 'running'
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.resumeContext()
      })

      expect(mockAudioContext.resume).not.toHaveBeenCalled()
    })
  })

  describe('getCurrentTime', () => {
    it('returns audio context current time', async () => {
      mockAudioContext.currentTime = 5.5
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getCurrentTime()).toBe(5.5)
    })
  })

  describe('effects', () => {
    it('configures lowpass filter for each instrument', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(mockInstruments.length)
      })
    })

    it('configures delay nodes for reverb effect', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        // 2 delay nodes per instrument
        expect(mockAudioContext.createDelay).toHaveBeenCalledTimes(mockInstruments.length * 2)
      })
    })

    it('creates gain nodes for volume and effects routing', async () => {
      renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        // mainGain, reverbGain, outputGain, feedback = 4 gains per instrument
        expect(mockAudioContext.createGain).toHaveBeenCalledTimes(mockInstruments.length * 4)
      })
    })
  })
})
