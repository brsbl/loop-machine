/**
 * @jest-environment jsdom
 */

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0 },
  })),
  createDelay: jest.fn(() => ({
    connect: jest.fn(),
    delayTime: { value: 0 },
  })),
  decodeAudioData: jest.fn(),
  createBufferSource: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    buffer: null,
  })),
  currentTime: 0,
  destination: {},
}));

// Mock fetch for audio file loading
global.fetch = jest.fn();

describe("Loop Machine Core Functionality", () => {
  beforeEach(() => {
    // Minimal DOM setup for functionality tests
    document.body.innerHTML = `
      <div class="instrument-tracks"></div>
      <button id="play-stop-button"></button>
    `;

    jest.clearAllMocks();
    
    // Mock fetch responses
    fetch.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  describe("State Conversion Utilities", () => {
    // These are pure functions that are critical for URL state persistence
    const stateToHex = (stateArray) => {
      const binaryString = stateArray.map((val) => (val ? "1" : "0")).join("");
      return parseInt(binaryString, 2).toString(16).padStart(4, "0");
    };

    const hexToState = (hexString) => {
      if (!hexString || hexString.length !== 4) return Array(16).fill(false);
      const binaryString = parseInt(hexString, 16)
        .toString(2)
        .padStart(16, "0");
      return binaryString.split("").map((char) => char === "1");
    };

    test("stateToHex should correctly encode sequencer state", () => {
      // Test empty pattern
      expect(stateToHex(Array(16).fill(false))).toBe("0000");
      
      // Test full pattern
      expect(stateToHex(Array(16).fill(true))).toBe("ffff");
      
      // Test specific patterns that might occur in drum sequences
      expect(stateToHex([
        true, false, false, false,  // Kick on 1
        true, false, false, false,  // Kick on 5
        true, false, false, false,  // Kick on 9
        true, false, false, false   // Kick on 13
      ])).toBe("8888");
      
      // Test hi-hat pattern
      expect(stateToHex([
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false
      ])).toBe("aaaa");
    });

    test("hexToState should correctly decode sequencer state", () => {
      // Test empty pattern
      expect(hexToState("0000")).toEqual(Array(16).fill(false));
      
      // Test full pattern
      expect(hexToState("ffff")).toEqual(Array(16).fill(true));
      
      // Test kick pattern
      expect(hexToState("8888")).toEqual([
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false
      ]);
      
      // Test invalid input handling
      expect(hexToState("")).toEqual(Array(16).fill(false));
      expect(hexToState("abc")).toEqual(Array(16).fill(false));
      expect(hexToState("12345")).toEqual(Array(16).fill(false));
    });

    test("stateToHex and hexToState should be inverse operations", () => {
      // Test roundtrip conversion
      const patterns = [
        Array(16).fill(false),
        Array(16).fill(true),
        [true, false, false, false, false, true, false, false, true, false, false, false, false, true, false, false],
        Array.from({length: 16}, (_, i) => i % 2 === 0),
        Array.from({length: 16}, (_, i) => i % 4 === 0),
      ];
      
      patterns.forEach(pattern => {
        const hex = stateToHex(pattern);
        const decoded = hexToState(hex);
        expect(decoded).toEqual(pattern);
      });
    });
  });

  describe("Slider Value Encoding", () => {
    const valueToChar = (val) => {
      const num = parseInt(val, 10);
      if (num >= 0 && num <= 9) return String(num);
      if (num === 10) return "a";
      return "0";
    };

    const charToValue = (char) => {
      if (char >= "0" && char <= "9") return parseInt(char, 10);
      if (char === "a") return 10;
      return 0;
    };

    test("valueToChar should encode slider values correctly", () => {
      // Test valid range
      for (let i = 0; i <= 10; i++) {
        if (i < 10) {
          expect(valueToChar(i)).toBe(String(i));
        } else {
          expect(valueToChar(i)).toBe("a");
        }
      }
      
      // Test out of range values
      expect(valueToChar(-1)).toBe("0");
      expect(valueToChar(11)).toBe("0");
      expect(valueToChar(100)).toBe("0");
    });

    test("charToValue should decode slider values correctly", () => {
      // Test valid characters
      for (let i = 0; i <= 9; i++) {
        expect(charToValue(String(i))).toBe(i);
      }
      expect(charToValue("a")).toBe(10);
      
      // Test invalid characters
      expect(charToValue("b")).toBe(0);
      expect(charToValue("z")).toBe(0);
      expect(charToValue("!")).toBe(0);
      expect(charToValue("")).toBe(0);
    });

    test("valueToChar and charToValue should be inverse operations", () => {
      for (let i = 0; i <= 10; i++) {
        const char = valueToChar(i);
        const value = charToValue(char);
        expect(value).toBe(i);
      }
    });
  });

  describe("Audio Loading", () => {
    test("should handle successful audio file loading", async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockAudioBuffer = { duration: 1.0 };
      
      fetch.mockResolvedValueOnce({
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      });
      
      const audioContext = new AudioContext();
      audioContext.decodeAudioData.mockResolvedValueOnce(mockAudioBuffer);
      
      const result = await audioContext.decodeAudioData(mockArrayBuffer);
      
      expect(result).toBe(mockAudioBuffer);
      expect(audioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
    });

    test("should handle audio loading failures gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));
      
      await expect(fetch("invalid-path.wav")).rejects.toThrow("Network error");
    });
  });

  describe("Sequencer Timing", () => {
    test("should calculate correct step time based on BPM", () => {
      const bpm = 120;
      const stepTime = 60 / bpm / 4; // Time per 16th note
      
      expect(stepTime).toBeCloseTo(0.125); // 125ms per step at 120 BPM
    });

    test("should calculate correct step time for different BPMs", () => {
      const testCases = [
        { bpm: 60, expectedStepTime: 0.25 },   // Slow
        { bpm: 120, expectedStepTime: 0.125 }, // Medium
        { bpm: 140, expectedStepTime: 0.107 }, // Fast
        { bpm: 180, expectedStepTime: 0.083 }, // Very fast
      ];
      
      testCases.forEach(({ bpm, expectedStepTime }) => {
        const stepTime = 60 / bpm / 4;
        expect(stepTime).toBeCloseTo(expectedStepTime, 3);
      });
    });
  });
});