/**
 * @jest-environment jsdom
 */

import { AudioManager } from '../src/audio/index.js';
import { StateManager } from '../src/state/index.js';
import { UIManager } from '../src/ui/index.js';
import { Sequencer } from '../src/core/index.js';

describe('Integration - Audio Initialization Failures', () => {
  let originalAudioContext;

  beforeEach(() => {
    originalAudioContext = global.AudioContext;
    // Mock DOM elements needed by UIManager
    document.body.innerHTML = `
      <div id="grid"></div>
      <button id="play-btn"></button>
      <div id="bpm-display"></div>
      <input id="bpm-slider" type="range" />
      <pre id="state-display"></pre>
      <button id="copy-btn"></button>
      <button id="edit-state-btn"></button>
      <div id="json-editor-modal" style="display: none;">
        <textarea id="json-editor"></textarea>
        <button id="save-json-btn"></button>
        <button id="cancel-json-btn"></button>
      </div>
    `;
  });

  afterEach(() => {
    global.AudioContext = originalAudioContext;
    jest.clearAllMocks();
  });

  test('should handle AudioContext creation failure gracefully', async () => {
    // Make AudioContext throw an error
    global.AudioContext = jest.fn().mockImplementation(() => {
      throw new Error('AudioContext not supported');
    });

    const audioManager = new AudioManager();
    const stateManager = new StateManager();
    const uiManager = new UIManager(stateManager, audioManager);
    const sequencer = new Sequencer(stateManager, audioManager, uiManager);

    // Initialize should fail
    const initResult = audioManager.init();
    expect(initResult).toBe(false);
    expect(audioManager.isInitialized()).toBe(false);

    // Sequencer should not start
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await sequencer.start();
    expect(consoleSpy).toHaveBeenCalledWith('AudioContext not initialized');
    expect(sequencer.isPlaying).toBe(false);

    consoleSpy.mockRestore();
  });

  test('should handle browser without AudioContext API', () => {
    // Remove AudioContext completely
    delete global.AudioContext;
    delete global.webkitAudioContext;

    const audioManager = new AudioManager();
    const initResult = audioManager.init();
    
    expect(initResult).toBe(false);
    expect(audioManager.isInitialized()).toBe(false);
    
    // Operations should handle gracefully
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    audioManager.playSound('kick', 1.0);
    expect(warnSpy).toHaveBeenCalledWith('Cannot play sound: AudioContext not initialized');
    
    warnSpy.mockRestore();
  });

  test('should handle audio loading failure after successful init', async () => {
    // Mock successful AudioContext creation
    const mockContext = {
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { value: 0, setValueAtTime: jest.fn() },
      })),
      createDelay: jest.fn(() => ({
        connect: jest.fn(),
        delayTime: { value: 0, setValueAtTime: jest.fn() },
      })),
      decodeAudioData: jest.fn(),
      currentTime: 0,
      destination: {},
      state: 'running',
    };

    global.AudioContext = jest.fn().mockImplementation(() => mockContext);
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const audioManager = new AudioManager();
    const stateManager = new StateManager();
    const uiManager = new UIManager(stateManager, audioManager);
    const sequencer = new Sequencer(stateManager, audioManager, uiManager);

    // Init should succeed
    expect(audioManager.init()).toBe(true);
    expect(audioManager.isInitialized()).toBe(true);

    // But loading should fail
    await expect(audioManager.loadSounds()).rejects.toThrow('Network error');
    
    // Sequencer should not start without loaded sounds
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    await sequencer.start();
    expect(warnSpy).toHaveBeenCalledWith('Audio buffers not loaded yet');
    expect(sequencer.isPlaying).toBe(false);

    warnSpy.mockRestore();
  });

  test('should handle suspended audio context', async () => {
    const mockContext = {
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { value: 0, setValueAtTime: jest.fn() },
      })),
      createDelay: jest.fn(() => ({
        connect: jest.fn(),
        delayTime: { value: 0, setValueAtTime: jest.fn() },
      })),
      decodeAudioData: jest.fn().mockResolvedValue({ duration: 1.0 }),
      createBufferSource: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        buffer: null,
      })),
      currentTime: 0,
      destination: {},
      state: 'suspended',
      resume: jest.fn().mockResolvedValue(),
    };

    global.AudioContext = jest.fn().mockImplementation(() => mockContext);
    global.fetch = jest.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });

    const audioManager = new AudioManager();
    const stateManager = new StateManager();
    const uiManager = new UIManager(stateManager, audioManager);
    const sequencer = new Sequencer(stateManager, audioManager, uiManager);

    // Initialize and load
    audioManager.init();
    await audioManager.loadSounds();

    // Start sequencer with suspended context
    await sequencer.start();
    
    // Should have resumed the context
    expect(mockContext.resume).toHaveBeenCalled();
    expect(sequencer.isPlaying).toBe(true);
    
    // Clean up
    sequencer.stop();
  });
});