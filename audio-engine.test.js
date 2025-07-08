const { SequencerEngine, StateSerializer, JsonStateManager } = require('./audio-engine.js');

// Mock AudioContext
const createMockAudioContext = () => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { 
      value: 0,
      setValueAtTime: jest.fn()
    },
  })),
  createDelay: jest.fn(() => ({
    connect: jest.fn(),
    delayTime: { 
      value: 0,
      setValueAtTime: jest.fn()
    },
  })),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    buffer: null,
  })),
  currentTime: 0,
  destination: {},
});

describe('SequencerEngine Core Business Logic', () => {
  let audioContext;
  let sequencer;
  const instrumentsData = [
    { name: 'hi hat', id: 'hihat', path: '808 Samples/hi hat (30).wav' },
    { name: 'snare', id: 'snare', path: '808 Samples/snare.wav' },
    { name: 'kick', id: 'kick', path: '808 Samples/kick.wav' },
  ];

  beforeEach(() => {
    audioContext = createMockAudioContext();
    sequencer = new SequencerEngine(audioContext, instrumentsData);
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(sequencer.steps).toBe(16);
      expect(sequencer.bpm).toBe(120);
      expect(sequencer.stepTime).toBeCloseTo(0.125); // 60 / 120 / 4
      expect(sequencer.isPlaying).toBe(false);
      expect(sequencer.currentStep).toBe(0);
    });

    test('should initialize empty sequence state for all instruments', () => {
      instrumentsData.forEach(instrument => {
        expect(sequencer.sequenceState[instrument.id]).toEqual(Array(16).fill(false));
      });
    });

    test('should calculate correct step time for different BPMs', () => {
      const seq140 = new SequencerEngine(audioContext, instrumentsData, 16, 140);
      expect(seq140.stepTime).toBeCloseTo(0.107, 3);
      
      const seq60 = new SequencerEngine(audioContext, instrumentsData, 16, 60);
      expect(seq60.stepTime).toBeCloseTo(0.25, 3);
    });
  });

  describe('Audio Buffer Management', () => {
    test('should load audio buffer and setup effect nodes', async () => {
      const mockBuffer = { duration: 1.0 };
      await sequencer.loadAudioBuffer('kick', mockBuffer);
      
      expect(sequencer.audioBuffers['kick']).toBe(mockBuffer);
      expect(sequencer.effectNodes['kick']).toBeDefined();
      expect(sequencer.effectNodes['kick'].mainGain).toBeDefined();
    });

    test('should check if all buffers are loaded', async () => {
      expect(sequencer.areAllBuffersLoaded()).toBe(false);
      
      // Load all buffers
      for (const instrument of instrumentsData) {
        await sequencer.loadAudioBuffer(instrument.id, { duration: 1.0 });
      }
      
      expect(sequencer.areAllBuffersLoaded()).toBe(true);
    });
  });

  describe('Sequence State Management', () => {
    test('should set and get sequence state correctly', () => {
      const kickPattern = [
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ];
      
      sequencer.setSequenceState('kick', kickPattern);
      expect(sequencer.getSequenceState('kick')).toEqual(kickPattern);
    });

    test('should throw error for invalid pattern length', () => {
      const invalidPattern = [true, false, true]; // Only 3 steps
      
      expect(() => {
        sequencer.setSequenceState('kick', invalidPattern);
      }).toThrow('Pattern must have exactly 16 steps');
    });

    test('should get notes for specific step', () => {
      sequencer.setSequenceState('kick', [true, false, false, false].concat(Array(12).fill(false)));
      sequencer.setSequenceState('snare', [false, false, true, false].concat(Array(12).fill(false)));
      sequencer.setSequenceState('hihat', [true, true, true, true].concat(Array(12).fill(false)));
      
      expect(sequencer.getNotesForStep(0)).toEqual(['hihat', 'kick']);
      expect(sequencer.getNotesForStep(1)).toEqual(['hihat']);
      expect(sequencer.getNotesForStep(2)).toEqual(['hihat', 'snare']);
      expect(sequencer.getNotesForStep(3)).toEqual(['hihat']);
      expect(sequencer.getNotesForStep(4)).toEqual([]);
    });
  });

  describe('Effect Processing', () => {
    beforeEach(async () => {
      await sequencer.loadAudioBuffer('kick', { duration: 1.0 });
    });

    test('should update reverb effect correctly', () => {
      sequencer.updateEffect('kick', 'reverb', 5);
      
      const reverbNode = sequencer.effectNodes['kick'].reverb;
      expect(reverbNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    });

    test('should update delay effect correctly', () => {
      sequencer.updateEffect('kick', 'delay', 10);
      
      const nodes = sequencer.effectNodes['kick'];
      expect(nodes.delay.delayTime.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
      expect(nodes.delayFeedback.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 0);
      expect(nodes.delayWet.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    });

    test('should handle effect updates for non-existent instruments', () => {
      // Should not throw
      expect(() => {
        sequencer.updateEffect('nonexistent', 'reverb', 5);
      }).not.toThrow();
    });
  });

  describe('Playback Control', () => {
    test('should start and stop playback correctly', () => {
      expect(sequencer.isPlaying).toBe(false);
      
      sequencer.start();
      expect(sequencer.isPlaying).toBe(true);
      expect(sequencer.currentStep).toBe(0);
      expect(sequencer.nextNoteTime).toBe(0);
      
      sequencer.stop();
      expect(sequencer.isPlaying).toBe(false);
    });

    test('should not restart if already playing', () => {
      sequencer.start();
      sequencer.currentStep = 5;
      
      sequencer.start(); // Try to start again
      expect(sequencer.currentStep).toBe(5); // Should not reset
    });

    test('should play sound when buffer and effects are loaded', async () => {
      const mockBuffer = { duration: 1.0 };
      await sequencer.loadAudioBuffer('kick', mockBuffer);
      
      const result = sequencer.playSound('kick', 1.0);
      expect(result).toBe(true);
      expect(audioContext.createBufferSource).toHaveBeenCalled();
    });

    test('should not play sound when buffer is missing', () => {
      const result = sequencer.playSound('kick', 1.0);
      expect(result).toBe(false);
      expect(audioContext.createBufferSource).not.toHaveBeenCalled();
    });
  });

  describe('Step Calculation', () => {
    test('should calculate next step time correctly', () => {
      sequencer.nextNoteTime = 0;
      sequencer.currentStep = 0;
      
      sequencer.calculateNextStepTime();
      expect(sequencer.nextNoteTime).toBeCloseTo(0.125);
      expect(sequencer.currentStep).toBe(1);
      
      sequencer.calculateNextStepTime();
      expect(sequencer.nextNoteTime).toBeCloseTo(0.25);
      expect(sequencer.currentStep).toBe(2);
    });

    test('should wrap around at end of sequence', () => {
      sequencer.currentStep = 15;
      sequencer.nextNoteTime = 1.875;
      
      sequencer.calculateNextStepTime();
      expect(sequencer.currentStep).toBe(0);
      expect(sequencer.nextNoteTime).toBeCloseTo(2.0);
    });
  });
});

describe('StateSerializer', () => {
  describe('Hex Conversion', () => {
    test('should convert state arrays to hex correctly', () => {
      expect(StateSerializer.stateToHex(Array(16).fill(false))).toBe('0000');
      expect(StateSerializer.stateToHex(Array(16).fill(true))).toBe('ffff');
      
      // Common drum patterns
      const kickPattern = [
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ];
      expect(StateSerializer.stateToHex(kickPattern)).toBe('8888');
    });

    test('should convert hex to state arrays correctly', () => {
      expect(StateSerializer.hexToState('0000')).toEqual(Array(16).fill(false));
      expect(StateSerializer.hexToState('ffff')).toEqual(Array(16).fill(true));
      expect(StateSerializer.hexToState('8888')).toEqual([
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
    });

    test('should handle invalid hex input', () => {
      expect(StateSerializer.hexToState('')).toEqual(Array(16).fill(false));
      expect(StateSerializer.hexToState('xyz')).toEqual(Array(16).fill(false));
      expect(StateSerializer.hexToState('12345')).toEqual(Array(16).fill(false));
    });
  });

  describe('Slider Value Encoding', () => {
    test('should encode slider values to characters', () => {
      for (let i = 0; i <= 9; i++) {
        expect(StateSerializer.valueToChar(i)).toBe(String(i));
      }
      expect(StateSerializer.valueToChar(10)).toBe('a');
      expect(StateSerializer.valueToChar(11)).toBe('0'); // Out of range
    });

    test('should decode characters to slider values', () => {
      for (let i = 0; i <= 9; i++) {
        expect(StateSerializer.charToValue(String(i))).toBe(i);
      }
      expect(StateSerializer.charToValue('a')).toBe(10);
      expect(StateSerializer.charToValue('z')).toBe(0); // Invalid
    });
  });

  describe('Full State Serialization', () => {
    test('should serialize complete sequencer state', () => {
      const audioContext = createMockAudioContext();
      const instrumentsData = [
        { id: 'kick' },
        { id: 'snare' },
        { id: 'hihat' }
      ];
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      // Set some patterns
      sequencer.setSequenceState('kick', Array(16).fill(false));
      sequencer.setSequenceState('snare', Array(16).fill(false));
      sequencer.setSequenceState('hihat', Array(16).fill(false));
      
      const serialized = StateSerializer.serializeState(sequencer, instrumentsData);
      expect(serialized).toBe('000000000000_000000'); // 3 instruments × 4 hex chars + _ + 3 × 2 slider chars
    });

    test('should deserialize state string correctly', () => {
      const audioContext = createMockAudioContext();
      const instrumentsData = [
        { id: 'kick' },
        { id: 'snare' }
      ];
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      const stateString = '8888aaaa_5a37';
      const result = StateSerializer.deserializeState(stateString, sequencer, instrumentsData);
      
      // Check kick pattern was applied
      expect(sequencer.getSequenceState('kick')).toEqual([
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
      
      // Check snare pattern was applied
      expect(sequencer.getSequenceState('snare')).toEqual([
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false
      ]);
      
      // Check effect values
      expect(result.kick.reverb).toBe(5);
      expect(result.kick.delay).toBe(10);
      expect(result.snare.reverb).toBe(3);
      expect(result.snare.delay).toBe(7);
    });

    test('should throw on invalid state string format', () => {
      const audioContext = createMockAudioContext();
      const instrumentsData = [{ id: 'kick' }];
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      expect(() => {
        StateSerializer.deserializeState('invalid', sequencer, instrumentsData);
      }).toThrow('Invalid state string format');
    });
  });
});

describe('JsonStateManager', () => {
  const instrumentsData = [
    { id: 'kick' },
    { id: 'snare' },
    { id: 'hihat' }
  ];

  describe('JSON Validation', () => {
    test('should validate correct JSON structure', () => {
      const validJson = {
        kick: {
          notes: {
            '1': [1, 0, 0, 0],
            '2': [1, 0, 0, 0],
            '3': [1, 0, 0, 0],
            '4': [1, 0, 0, 0]
          },
          reverb: 5,
          delay: 3
        },
        snare: {
          notes: {
            '1': [0, 0, 1, 0],
            '2': [0, 0, 1, 0],
            '3': [0, 0, 1, 0],
            '4': [0, 0, 1, 0]
          },
          reverb: 7,
          delay: 2
        },
        hihat: {
          notes: {
            '1': [1, 1, 1, 1],
            '2': [1, 1, 1, 1],
            '3': [1, 1, 1, 1],
            '4': [1, 1, 1, 1]
          },
          reverb: 0,
          delay: 0
        }
      };
      
      const errors = JsonStateManager.validateJsonState(validJson, instrumentsData);
      expect(errors).toEqual([]);
    });

    test('should detect missing instruments', () => {
      const invalidJson = {
        kick: {
          notes: { '1': [1, 0, 0, 0], '2': [0, 0, 0, 0], '3': [0, 0, 0, 0], '4': [0, 0, 0, 0] },
          reverb: 5,
          delay: 3
        }
        // Missing snare and hihat
      };
      
      const errors = JsonStateManager.validateJsonState(invalidJson, instrumentsData);
      expect(errors).toContain('Missing data for instrument: snare');
      expect(errors).toContain('Missing data for instrument: hihat');
    });

    test('should detect invalid note values', () => {
      const invalidJson = {
        kick: {
          notes: {
            '1': [1, 0, 2, 0], // Invalid value: 2
            '2': [0, 0, 0, 0],
            '3': [0, 0, 0, 0],
            '4': [0, 0, 0, 0]
          },
          reverb: 5,
          delay: 3
        }
      };
      
      const errors = JsonStateManager.validateJsonState(invalidJson, [{ id: 'kick' }]);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid note value 2');
    });

    test('should detect invalid effect values', () => {
      const invalidJson = {
        kick: {
          notes: { '1': [0, 0, 0, 0], '2': [0, 0, 0, 0], '3': [0, 0, 0, 0], '4': [0, 0, 0, 0] },
          reverb: 15, // Out of range
          delay: -1   // Negative
        }
      };
      
      const errors = JsonStateManager.validateJsonState(invalidJson, [{ id: 'kick' }]);
      expect(errors).toContain('kick: Invalid reverb value 15');
      expect(errors).toContain('kick: Invalid delay value -1');
    });
  });

  describe('JSON Application', () => {
    test('should apply valid JSON state to sequencer', () => {
      const audioContext = createMockAudioContext();
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      // Load buffers first
      instrumentsData.forEach(inst => {
        sequencer.loadAudioBuffer(inst.id, { duration: 1.0 });
      });
      
      const jsonState = {
        kick: {
          notes: {
            '1': [1, 0, 0, 0],
            '2': [1, 0, 0, 0],
            '3': [1, 0, 0, 0],
            '4': [1, 0, 0, 0]
          },
          reverb: 5,
          delay: 3
        },
        snare: {
          notes: {
            '1': [0, 0, 1, 0],
            '2': [0, 0, 1, 0],
            '3': [0, 0, 1, 0],
            '4': [0, 0, 1, 0]
          },
          reverb: 7,
          delay: 2
        },
        hihat: {
          notes: {
            '1': [1, 1, 1, 1],
            '2': [1, 1, 1, 1],
            '3': [1, 1, 1, 1],
            '4': [1, 1, 1, 1]
          },
          reverb: 0,
          delay: 0
        }
      };
      
      const result = JsonStateManager.applyJsonState(jsonState, sequencer, instrumentsData);
      expect(result).toBe(true);
      
      // Verify patterns were applied
      expect(sequencer.getSequenceState('kick')).toEqual([
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
      
      expect(sequencer.getSequenceState('snare')).toEqual([
        false, false, true, false,
        false, false, true, false,
        false, false, true, false,
        false, false, true, false
      ]);
    });

    test('should throw on invalid JSON state', () => {
      const audioContext = createMockAudioContext();
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      const invalidJson = {
        kick: {
          notes: { '1': [1, 0, 2, 0] }, // Invalid
          reverb: 5,
          delay: 3
        }
      };
      
      expect(() => {
        JsonStateManager.applyJsonState(invalidJson, sequencer, instrumentsData);
      }).toThrow('Validation errors:');
    });
  });

  describe('JSON Export', () => {
    test('should export sequencer state to JSON format', () => {
      const audioContext = createMockAudioContext();
      const sequencer = new SequencerEngine(audioContext, instrumentsData);
      
      // Set patterns
      sequencer.setSequenceState('kick', [
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
      
      const effectValues = {
        kick: { reverb: 5, delay: 3 },
        snare: { reverb: 0, delay: 0 },
        hihat: { reverb: 2, delay: 1 }
      };
      
      const exported = JsonStateManager.exportToJson(sequencer, instrumentsData, effectValues);
      
      expect(exported.kick.notes['1']).toEqual([1, 0, 0, 0]);
      expect(exported.kick.reverb).toBe(5);
      expect(exported.kick.delay).toBe(3);
    });
  });
});