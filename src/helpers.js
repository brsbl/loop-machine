/**
 * Helper functions for state serialization and value conversion
 * Extracted from script.js for testing and modularity
 */

const STEPS = 16;

/**
 * Convert boolean array (16 steps) to 4-char hex string
 * @param {boolean[]} stateArray - Array of 16 boolean values
 * @returns {string} 4-character hex string
 * @example
 * stateToHex([true, false, true, false, ...]) // "a5f3"
 */
export function stateToHex(stateArray) {
  const binaryString = stateArray.map((val) => (val ? "1" : "0")).join("");
  return parseInt(binaryString, 2).toString(16).padStart(4, "0");
}

/**
 * Convert 4-char hex string back to boolean array (16 steps)
 * @param {string} hexString - 4-character hex string
 * @returns {boolean[]} Array of 16 boolean values
 * @example
 * hexToState("a5f3") // [true, false, true, false, ...]
 */
export function hexToState(hexString) {
  if (!hexString || hexString.length !== 4) return Array(STEPS).fill(false);
  const binaryString = parseInt(hexString, 16)
    .toString(2)
    .padStart(STEPS, "0");
  return binaryString.split("").map((char) => char === "1");
}

/**
 * Convert slider value (0-10) to char ('0'-'9', 'a')
 * @param {number|string} val - Value from 0 to 10
 * @returns {string} Single character representation
 * @example
 * valueToChar(5) // "5"
 * valueToChar(10) // "a"
 */
export function valueToChar(val) {
  const num = parseInt(val, 10);
  if (num >= 0 && num <= 9) return String(num);
  if (num === 10) return "a";
  return "0"; // Default fallback
}

/**
 * Convert char ('0'-'9', 'a') back to slider value (0-10)
 * @param {string} char - Single character from '0'-'9' or 'a'
 * @returns {number} Value from 0 to 10
 * @example
 * charToValue("5") // 5
 * charToValue("a") // 10
 */
export function charToValue(char) {
  if (char >= "0" && char <= "9") return parseInt(char, 10);
  if (char === "a") return 10;
  return 0; // Default fallback
}
