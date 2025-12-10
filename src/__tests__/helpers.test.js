import { describe, it, expect } from 'vitest';
import { stateToHex, hexToState, valueToChar, charToValue } from '../helpers.js';

describe('stateToHex', () => {
  it('converts all false to 0000', () => {
    const state = Array(16).fill(false);
    expect(stateToHex(state)).toBe('0000');
  });

  it('converts all true to ffff', () => {
    const state = Array(16).fill(true);
    expect(stateToHex(state)).toBe('ffff');
  });

  it('converts alternating pattern correctly', () => {
    // Pattern: [true, false, true, false, ...] = 1010101010101010 = aaaa
    const state = Array(16).fill(false).map((_, i) => i % 2 === 0);
    expect(stateToHex(state)).toBe('aaaa');
  });

  it('converts specific pattern', () => {
    // First 8 true, last 8 false = 11111111 00000000 = ff00
    const state = Array(16).fill(false).map((_, i) => i < 8);
    expect(stateToHex(state)).toBe('ff00');
  });

  it('pads with zeros for small values', () => {
    // Only last position true = 0000000000000001 = 0001
    const state = Array(16).fill(false);
    state[15] = true;
    expect(stateToHex(state)).toBe('0001');
  });
});

describe('hexToState', () => {
  it('converts 0000 to all false', () => {
    const state = hexToState('0000');
    expect(state).toHaveLength(16);
    expect(state.every(val => val === false)).toBe(true);
  });

  it('converts ffff to all true', () => {
    const state = hexToState('ffff');
    expect(state).toHaveLength(16);
    expect(state.every(val => val === true)).toBe(true);
  });

  it('converts aaaa to alternating pattern', () => {
    const state = hexToState('aaaa');
    expect(state).toHaveLength(16);
    // 1010... pattern
    state.forEach((val, i) => {
      expect(val).toBe(i % 2 === 0);
    });
  });

  it('converts ff00 to first 8 true, last 8 false', () => {
    const state = hexToState('ff00');
    expect(state).toHaveLength(16);
    state.forEach((val, i) => {
      expect(val).toBe(i < 8);
    });
  });

  it('handles invalid input with empty string', () => {
    const state = hexToState('');
    expect(state).toHaveLength(16);
    expect(state.every(val => val === false)).toBe(true);
  });

  it('handles invalid input with wrong length', () => {
    const state = hexToState('fff');
    expect(state).toHaveLength(16);
    expect(state.every(val => val === false)).toBe(true);
  });

  it('handles null/undefined input', () => {
    const state1 = hexToState(null);
    const state2 = hexToState(undefined);
    expect(state1).toHaveLength(16);
    expect(state2).toHaveLength(16);
    expect(state1.every(val => val === false)).toBe(true);
    expect(state2.every(val => val === false)).toBe(true);
  });

  it('round-trips correctly with stateToHex', () => {
    const original = [true, false, true, true, false, false, true, false,
                     false, true, false, true, true, true, false, false];
    const hex = stateToHex(original);
    const restored = hexToState(hex);
    expect(restored).toEqual(original);
  });
});

describe('valueToChar', () => {
  it('converts 0 to "0"', () => {
    expect(valueToChar(0)).toBe('0');
  });

  it('converts 9 to "9"', () => {
    expect(valueToChar(9)).toBe('9');
  });

  it('converts 10 to "a"', () => {
    expect(valueToChar(10)).toBe('a');
  });

  it('converts middle values correctly', () => {
    expect(valueToChar(5)).toBe('5');
    expect(valueToChar(7)).toBe('7');
  });

  it('handles string input', () => {
    expect(valueToChar('5')).toBe('5');
    expect(valueToChar('10')).toBe('a');
  });

  it('returns "0" for invalid input', () => {
    expect(valueToChar(11)).toBe('0');
    expect(valueToChar(-1)).toBe('0');
    expect(valueToChar(NaN)).toBe('0');
  });

  it('converts all valid values 0-10', () => {
    const expected = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a'];
    for (let i = 0; i <= 10; i++) {
      expect(valueToChar(i)).toBe(expected[i]);
    }
  });
});

describe('charToValue', () => {
  it('converts "0" to 0', () => {
    expect(charToValue('0')).toBe(0);
  });

  it('converts "9" to 9', () => {
    expect(charToValue('9')).toBe(9);
  });

  it('converts "a" to 10', () => {
    expect(charToValue('a')).toBe(10);
  });

  it('converts middle values correctly', () => {
    expect(charToValue('5')).toBe(5);
    expect(charToValue('7')).toBe(7);
  });

  it('returns 0 for invalid input', () => {
    expect(charToValue('b')).toBe(0);
    expect(charToValue('z')).toBe(0);
    expect(charToValue('')).toBe(0);
  });

  it('converts all valid chars 0-9 and a', () => {
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a'];
    chars.forEach((char, index) => {
      expect(charToValue(char)).toBe(index);
    });
  });

  it('round-trips correctly with valueToChar', () => {
    for (let i = 0; i <= 10; i++) {
      const char = valueToChar(i);
      const value = charToValue(char);
      expect(value).toBe(i);
    }
  });
});

describe('integration tests', () => {
  it('valueToChar and charToValue round-trip', () => {
    for (let i = 0; i <= 10; i++) {
      expect(charToValue(valueToChar(i))).toBe(i);
    }
  });

  it('stateToHex and hexToState round-trip with various patterns', () => {
    const patterns = [
      Array(16).fill(false),
      Array(16).fill(true),
      Array(16).fill(false).map((_, i) => i % 2 === 0),
      Array(16).fill(false).map((_, i) => i % 3 === 0),
      Array(16).fill(false).map((_, i) => i < 4),
      Array(16).fill(false).map((_, i) => i >= 12),
    ];

    patterns.forEach(pattern => {
      const hex = stateToHex(pattern);
      const restored = hexToState(hex);
      expect(restored).toEqual(pattern);
    });
  });
});
