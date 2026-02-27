/**
 * Utilities for validating and working with decimal button codes (1-16).
 */

/**
 * Validates that a decimal code is in the valid range (1-16).
 */
export function isValidDecimalCode(code: number): boolean {
  return Number.isInteger(code) && code >= 1 && code <= 16;
}

/**
 * Validate decimal code and return error message if invalid
 */
export function validateDecimalCode(code: number | string): string | null {
  const numCode = typeof code === 'string' ? parseInt(code, 10) : code;
  
  if (isNaN(numCode)) {
    return 'Code must be a number';
  }
  
  if (!Number.isInteger(numCode)) {
    return 'Code must be a whole number';
  }
  
  if (numCode < 1 || numCode > 16) {
    return 'Code must be between 1 and 16';
  }
  
  return null;
}

/**
 * Generates a deterministic decimal code (1-16) from a string seed.
 */
export function generateDecimalCodeFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return ((Math.abs(hash) % 16) + 1);
}

/**
 * Convert decimal code (1-16) to 4-bit binary string for GPIO
 * Examples: 1 -> "0000", 2 -> "0001", 16 -> "1111"
 */
export function decimalToBinary(decimalCode: number): string {
  if (!isValidDecimalCode(decimalCode)) {
    throw new Error('Decimal code must be between 1 and 16');
  }
  const binaryValue = decimalCode - 1;
  return binaryValue.toString(2).padStart(4, '0');
}

/**
 * Convert 4-bit binary string to decimal code (1-16)
 */
export function binaryToDecimal(binaryCode: string): number {
  if (binaryCode.length !== 4 || !/^[01]+$/.test(binaryCode)) {
    throw new Error('Binary code must be exactly 4 bits (0s and 1s)');
  }
  return parseInt(binaryCode, 2) + 1;
}
