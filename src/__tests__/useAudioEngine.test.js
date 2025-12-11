import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAudioEngine } from '../hooks/useAudioEngine'

// Mock AudioContext with a class
class MockAudioContext {
  constructor() {
    this.state = 'running'
    this.currentTime = 0
    this.destination = {}
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
  }

  createDelay() {
    return {
      delayTime: { value: 0 },
      connect: vi.fn(),
    }
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 20000, setValueAtTime: vi.fn() },
      Q: { value: 1 },
      connect: vi.fn(),
    }
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    }
  }

  decodeAudioData() {
    return Promise.resolve({})
  }

  resume() {
    return Promise.resolve()
  }

  close() {
    return Promise.resolve()
  }
}

vi.stubGlobal('AudioContext', MockAudioContext)
vi.stubGlobal('webkitAudioContext', MockAudioContext)

// Mock fetch
vi.stubGlobal('fetch', vi.fn(() => {
  return Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
}))

describe('useAudioEngine', () => {
  const mockInstruments = [
    { id: 'kick', name: 'Kick', path: '/samples/kick.wav' },
    { id: 'snare', name: 'Snare', path: '/samples/snare.wav' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('initializes and loads audio', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('sets isLoading to false after loading', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('playSound', () => {
    it('exposes playSound function', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.playSound).toBe('function')
    })

    it('does not throw when playing muted sound', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(() => {
        act(() => {
          result.current.playSound('kick', 0, { muted: true })
        })
      }).not.toThrow()
    })
  })

  describe('resumeContext', () => {
    it('exposes resumeContext function', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.resumeContext).toBe('function')
    })

    it('can be called without throwing', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(act(async () => {
        await result.current.resumeContext()
      })).resolves.not.toThrow()
    })
  })

  describe('getCurrentTime', () => {
    it('returns audio context current time', async () => {
      const { result } = renderHook(() => useAudioEngine(mockInstruments))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Default currentTime is 0
      expect(result.current.getCurrentTime()).toBe(0)
    })
  })

})
