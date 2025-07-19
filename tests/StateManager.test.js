/**
 * @jest-environment jsdom
 */

import { StateManager } from '../src/components/StateManager.js';
import { CONFIG } from '../src/config/config.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('State Conversion Utilities', () => {
    test('stateToHex should correctly encode sequencer state', () => {
      // Test empty pattern
      expect(stateManager.stateToHex(Array(16).fill(false))).toBe('0000');
      
      // Test full pattern
      expect(stateManager.stateToHex(Array(16).fill(true))).toBe('ffff');
      
      // Test specific patterns that might occur in drum sequences
      expect(stateManager.stateToHex([
        true, false, false, false,  // Kick on 1
        true, false, false, false,  // Kick on 5
        true, false, false, false,  // Kick on 9
        true, false, false, false   // Kick on 13
      ])).toBe('8888');
      
      // Test hi-hat pattern
      expect(stateManager.stateToHex([
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false
      ])).toBe('aaaa');
    });

    test('hexToState should correctly decode sequencer state', () => {
      // Test empty pattern
      expect(stateManager.hexToState('0000')).toEqual(Array(16).fill(false));
      
      // Test full pattern
      expect(stateManager.hexToState('ffff')).toEqual(Array(16).fill(true));
      
      // Test kick pattern
      expect(stateManager.hexToState('8888')).toEqual([
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
      
      // Test invalid input handling
      expect(stateManager.hexToState('')).toEqual(Array(16).fill(false));
      expect(stateManager.hexToState('abc')).toEqual(Array(16).fill(false));
      expect(stateManager.hexToState('12345')).toEqual(Array(16).fill(false));
    });

    test('stateToHex and hexToState should be inverse operations', () => {
      // Test roundtrip conversion
      const patterns = [
        Array(16).fill(false),
        Array(16).fill(true),
        [true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false],
        Array.from({length: 16}, (_, i) => i % 2 === 0),
        Array.from({length: 16}, (_, i) => i % 4 === 0),
      ];
      
      patterns.forEach(pattern => {
        const hex = stateManager.stateToHex(pattern);
        const decoded = stateManager.hexToState(hex);
        expect(decoded).toEqual(pattern);
      });
    });
  });

  describe('Slider Value Encoding', () => {
    test('valueToChar should encode slider values correctly', () => {
      // Test valid range
      for (let i = 0; i <= 9; i++) {
        expect(stateManager.valueToChar(i)).toBe(String(i));
      }
      expect(stateManager.valueToChar(10)).toBe('a');
      
      // Test out of range values
      expect(stateManager.valueToChar(-1)).toBe('0');
      expect(stateManager.valueToChar(11)).toBe('0');
      expect(stateManager.valueToChar(100)).toBe('0');
    });

    test('charToValue should decode slider values correctly', () => {
      // Test valid characters
      for (let i = 0; i <= 9; i++) {
        expect(stateManager.charToValue(String(i))).toBe(i);
      }
      expect(stateManager.charToValue('a')).toBe(10);
      
      // Test invalid characters
      expect(stateManager.charToValue('b')).toBe(0);
      expect(stateManager.charToValue('z')).toBe(0);
      expect(stateManager.charToValue('!')).toBe(0);
      expect(stateManager.charToValue('')).toBe(0);
    });

    test('valueToChar and charToValue should be inverse operations', () => {
      for (let i = 0; i <= 10; i++) {
        const char = stateManager.valueToChar(i);
        const value = stateManager.charToValue(char);
        expect(value).toBe(i);
      }
    });
  });

  describe('State Management', () => {
    test('should initialize with empty state for all instruments', () => {
      const state = stateManager.getState();
      CONFIG.INSTRUMENTS.forEach(instrument => {
        expect(state[instrument.id]).toEqual(Array(CONFIG.STEPS).fill(false));
      });
    });

    test('should update individual steps', () => {
      stateManager.updateStep('kick', 0, true);
      stateManager.updateStep('kick', 4, true);
      
      const state = stateManager.getState();
      expect(state.kick[0]).toBe(true);
      expect(state.kick[4]).toBe(true);
      expect(state.kick[1]).toBe(false);
    });

    test('should toggle steps correctly', () => {
      const initial = stateManager.toggleStep('snare', 2);
      expect(initial).toBe(true);
      
      const toggled = stateManager.toggleStep('snare', 2);
      expect(toggled).toBe(false);
      
      const state = stateManager.getState();
      expect(state.snare[2]).toBe(false);
    });

    test('should reset state correctly', () => {
      // Set some state
      stateManager.updateStep('kick', 0, true);
      stateManager.updateStep('snare', 4, true);
      
      // Reset
      stateManager.reset();
      
      // Check all is cleared
      const state = stateManager.getState();
      CONFIG.INSTRUMENTS.forEach(instrument => {
        expect(state[instrument.id]).toEqual(Array(CONFIG.STEPS).fill(false));
      });
    });
  });

  describe('Compact State Generation and Parsing', () => {
    test('should generate compact state string correctly', () => {
      // Set up some state
      stateManager.updateStep('hihat', 0, true);
      stateManager.updateStep('hihat', 2, true);
      stateManager.updateStep('snare', 4, true);
      stateManager.updateStep('kick', 0, true);
      
      const sliderValues = {
        hihat: { reverb: 5, delay: 3 },
        snare: { reverb: 7, delay: 0 },
        kick: { reverb: 0, delay: 10 }
      };
      
      const compact = stateManager.generateCompactState(sliderValues);
      
      // Should be: hihat(a000) + snare(0800) + kick(8000) + "_" + sliders
      expect(compact).toMatch(/^[0-9a-f]{12}_[0-9a]{6}$/);
      expect(compact).toBe('a00008008000_537000a');
    });

    test('should parse compact state string correctly', () => {
      const compactState = 'a00008008000_537000a';
      const parsed = stateManager.parseCompactState(compactState);
      
      expect(parsed).not.toBeNull();
      expect(parsed.notes.hihat[0]).toBe(true);
      expect(parsed.notes.hihat[2]).toBe(true);
      expect(parsed.notes.snare[4]).toBe(true);
      expect(parsed.notes.kick[0]).toBe(true);
      
      expect(parsed.sliders.hihat).toEqual({ reverb: 5, delay: 3 });
      expect(parsed.sliders.snare).toEqual({ reverb: 7, delay: 0 });
      expect(parsed.sliders.kick).toEqual({ reverb: 0, delay: 10 });
    });

    test('should handle invalid compact state strings', () => {
      expect(stateManager.parseCompactState('')).toBeNull();
      expect(stateManager.parseCompactState('invalid')).toBeNull();
      expect(stateManager.parseCompactState('123')).toBeNull();
      expect(stateManager.parseCompactState('a000_53')).toBeNull(); // Too short
    });
  });

  describe('JSON State Handling', () => {
    test('should generate JSON state correctly', () => {
      stateManager.updateStep('kick', 0, true);
      stateManager.updateStep('kick', 4, true);
      
      const sliderValues = {
        hihat: { reverb: 0, delay: 0 },
        snare: { reverb: 0, delay: 0 },
        kick: { reverb: 5, delay: 3 }
      };
      
      const json = stateManager.getStateAsJson(sliderValues);
      
      expect(json.kick.notes['1']).toEqual([1, 0, 0, 0]);
      expect(json.kick.notes['2']).toEqual([1, 0, 0, 0]);
      expect(json.kick.reverb).toBe(5);
      expect(json.kick.delay).toBe(3);
    });

    test('should apply valid JSON state', () => {
      const jsonState = {
        hihat: {
          notes: { '1': [1, 0, 1, 0], '2': [1, 0, 1, 0], '3': [1, 0, 1, 0], '4': [1, 0, 1, 0] },
          reverb: 3,
          delay: 5
        },
        snare: {
          notes: { '1': [0, 0, 0, 0], '2': [1, 0, 0, 0], '3': [0, 0, 0, 0], '4': [1, 0, 0, 0] },
          reverb: 7,
          delay: 2
        },
        kick: {
          notes: { '1': [1, 0, 0, 0], '2': [0, 0, 0, 0], '3': [1, 0, 0, 0], '4': [0, 0, 0, 0] },
          reverb: 0,
          delay: 0
        }
      };
      
      const result = stateManager.applyJsonState(jsonState);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      
      const state = stateManager.getState();
      expect(state.hihat[0]).toBe(true);
      expect(state.hihat[2]).toBe(true);
      expect(state.snare[4]).toBe(true);
      expect(state.kick[0]).toBe(true);
    });

    test('should validate JSON state structure', () => {
      const invalidStates = [
        // Missing instrument
        { hihat: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 } },
        // Invalid note value
        { 
          hihat: { notes: { '1': [2,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 },
          snare: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 },
          kick: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 }
        },
        // Missing reverb
        { 
          hihat: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, delay: 0 },
          snare: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 },
          kick: { notes: { '1': [0,0,0,0], '2': [0,0,0,0], '3': [0,0,0,0], '4': [0,0,0,0] }, reverb: 0, delay: 0 }
        }
      ];
      
      invalidStates.forEach(state => {
        const result = stateManager.applyJsonState(state);
        expect(result.success).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });
  });
});