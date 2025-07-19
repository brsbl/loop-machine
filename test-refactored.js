#!/usr/bin/env node

// Simple test runner for the refactored modules
// This demonstrates that the refactored code maintains the same functionality

import { StateManager } from './StateManager.js';

console.log('Testing Refactored Code...\n');

// Test StateManager
console.log('=== Testing StateManager ===');
const stateManager = new StateManager();

// Test state to hex conversion
const testPattern = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
const hex = stateManager.stateToHex(testPattern);
console.log('Pattern:', testPattern.map(b => b ? '1' : '0').join(''));
console.log('Hex:', hex);
console.log('Expected: 8888');
console.log('Pass:', hex === '8888' ? '✓' : '✗');

// Test hex to state conversion
const decoded = stateManager.hexToState('aaaa');
console.log('\nHex: aaaa');
console.log('Decoded:', decoded.map(b => b ? '1' : '0').join(''));
console.log('Expected: 1010101010101010');
console.log('Pass:', decoded.every((v, i) => v === (i % 2 === 0)) ? '✓' : '✗');

// Test slider encoding
console.log('\n=== Testing Slider Encoding ===');
for (let i = 0; i <= 10; i++) {
  const char = stateManager.valueToChar(i);
  const value = stateManager.charToValue(char);
  console.log(`Value ${i} -> Char '${char}' -> Value ${value} ${value === i ? '✓' : '✗'}`);
}

// Test compact state generation
console.log('\n=== Testing Compact State ===');
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
console.log('Compact state:', compact);
console.log('Expected format: 12 hex chars + _ + 6 chars');
console.log('Pass:', /^[0-9a-f]{12}_[0-9a]{6}$/.test(compact) ? '✓' : '✗');

// Test parsing compact state
const parsed = stateManager.parseCompactState(compact);
console.log('\nParsed state:');
console.log('- hihat note 0:', parsed.notes.hihat[0] ? '✓' : '✗');
console.log('- hihat reverb:', parsed.sliders.hihat.reverb === 5 ? '✓' : '✗');
console.log('- snare note 4:', parsed.notes.snare[4] ? '✓' : '✗');
console.log('- kick delay:', parsed.sliders.kick.delay === 10 ? '✓' : '✗');

console.log('\n=== All Tests Complete ===');