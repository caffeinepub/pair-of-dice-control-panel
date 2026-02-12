export function validateBinaryCode(code: string): string | null {
  if (!code.trim()) return 'Binary code cannot be empty';
  if (!/^[01]+$/.test(code)) return 'Binary code must contain only 0 and 1';
  if (code.length !== 4) return 'Binary code must be exactly 4 characters';
  return null;
}

export function generateDefaultBinaryCode(seed: string): string {
  // Generate a deterministic 4-bit binary code from a string seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const binary = (Math.abs(hash) % 16).toString(2).padStart(4, '0');
  return binary;
}
