/**
 * Utilities for converting between decimal button codes (1-16) and internal 4-bit binary codes.
 * Decimal 1 maps to binary "0000", decimal 16 maps to binary "1111".
 */

/**
 * Convert decimal code (1-16) to internal 4-bit binary string
 */
export function decimalToBinary(decimalCode: number): string {
  if (!isValidDecimalCode(decimalCode)) {
    throw new Error('Decimal code must be between 1 and 16');
  }
  // Subtract 1 to map 1-16 to 0-15, then convert to binary and pad to 4 bits
  const binaryValue = decimalCode - 1;
  return binaryValue.toString(2).padStart(4, '0');
}

/**
 * Convert internal 4-bit binary string to displayed decimal code (1-16)
 */
export function binaryToDecimal(binaryCode: string): number {
  if (binaryCode.length !== 4 || !/^[01]+$/.test(binaryCode)) {
    throw new Error('Binary code must be exactly 4 bits (0s and 1s)');
  }
  // Parse binary and add 1 to map 0-15 to 1-16
  return parseInt(binaryCode, 2) + 1;
}

/**
 * Validate that a decimal code is in the valid range (1-16)
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
 * Safely derive a valid button ID (1-16) from a binary code string.
 * Returns the decimal ID if valid, or null if invalid.
 */
export function deriveButtonIdFromBinaryCode(binaryCode: string): number | null {
  try {
    const decimal = binaryToDecimal(binaryCode);
    return isValidDecimalCode(decimal) ? decimal : null;
  } catch {
    return null;
  }
}
