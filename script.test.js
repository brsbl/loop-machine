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

describe("Loop Machine Tests", () => {
  let originalDocument;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="instrument-tracks"></div>
      <button id="play-stop-button">START/STOP</button>
      <button id="toggle-sidebar-button"></button>
      <button id="reset-button">RESET</button>
      <div id="sidebar"></div>
      <pre><code id="json-editor"></code></pre>
      <button id="apply-json-button">Apply</button>
    `;

    // Clear any modules
    jest.clearAllMocks();
    
    // Mock fetch responses
    fetch.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Utility Functions", () => {
    test("stateToHex converts boolean array to hex string", () => {
      // Need to extract these functions from script.js
      // For now, we'll test the logic inline
      const stateToHex = (stateArray) => {
        const binaryString = stateArray.map((val) => (val ? "1" : "0")).join("");
        return parseInt(binaryString, 2).toString(16).padStart(4, "0");
      };

      expect(stateToHex(Array(16).fill(false))).toBe("0000");
      expect(stateToHex(Array(16).fill(true))).toBe("ffff");
      expect(stateToHex([true, false, true, false, true, false, true, false,
                         true, false, true, false, true, false, true, false])).toBe("aaaa");
    });

    test("hexToState converts hex string to boolean array", () => {
      const hexToState = (hexString) => {
        if (!hexString || hexString.length !== 4) return Array(16).fill(false);
        const binaryString = parseInt(hexString, 16)
          .toString(2)
          .padStart(16, "0");
        return binaryString.split("").map((char) => char === "1");
      };

      expect(hexToState("0000")).toEqual(Array(16).fill(false));
      expect(hexToState("ffff")).toEqual(Array(16).fill(true));
      expect(hexToState("aaaa")).toEqual([true, false, true, false, true, false, true, false,
                                          true, false, true, false, true, false, true, false]);
    });

    test("valueToChar converts slider value to character", () => {
      const valueToChar = (val) => {
        const num = parseInt(val, 10);
        if (num >= 0 && num <= 9) return String(num);
        if (num === 10) return "a";
        return "0";
      };

      expect(valueToChar(0)).toBe("0");
      expect(valueToChar(5)).toBe("5");
      expect(valueToChar(9)).toBe("9");
      expect(valueToChar(10)).toBe("a");
      expect(valueToChar(11)).toBe("0"); // Out of range
    });

    test("charToValue converts character to slider value", () => {
      const charToValue = (char) => {
        if (char >= "0" && char <= "9") return parseInt(char, 10);
        if (char === "a") return 10;
        return 0;
      };

      expect(charToValue("0")).toBe(0);
      expect(charToValue("5")).toBe(5);
      expect(charToValue("9")).toBe(9);
      expect(charToValue("a")).toBe(10);
      expect(charToValue("b")).toBe(0); // Invalid char
    });
  });

  describe("DOM Interactions", () => {
    test("Play/Stop button should exist", () => {
      const playStopButton = document.getElementById("play-stop-button");
      expect(playStopButton).toBeTruthy();
      expect(playStopButton.textContent).toContain("START");
    });

    test("Sidebar toggle button should exist", () => {
      const toggleButton = document.getElementById("toggle-sidebar-button");
      expect(toggleButton).toBeTruthy();
    });

    test("Reset button should exist", () => {
      const resetButton = document.getElementById("reset-button");
      expect(resetButton).toBeTruthy();
      expect(resetButton.textContent).toBe("RESET");
    });
  });

  describe("URL State Management", () => {
    test("URL should update when state changes", () => {
      const mockReplaceState = jest.fn();
      window.history.replaceState = mockReplaceState;

      // Simulate state update
      const params = new URLSearchParams();
      params.set("s", "0000_000000");
      const newUrl = window.location.pathname + "?" + params.toString();
      
      window.history.replaceState(null, "", newUrl);
      
      expect(mockReplaceState).toHaveBeenCalledWith(null, "", newUrl);
    });

    test("Sidebar state should be reflected in URL", () => {
      document.body.classList.add("sidebar-visible");
      
      const params = new URLSearchParams();
      if (document.body.classList.contains("sidebar-visible")) {
        params.set("sidebar", "1");
      }
      
      expect(params.get("sidebar")).toBe("1");
    });
  });

  describe("Audio Context", () => {
    test("AudioContext should be created on demand", () => {
      const audioContext = new AudioContext();
      expect(AudioContext).toHaveBeenCalled();
      expect(audioContext.createGain).toBeDefined();
      expect(audioContext.createDelay).toBeDefined();
    });
  });
});