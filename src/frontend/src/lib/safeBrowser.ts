/**
 * Safe browser API utilities that handle unavailable or blocked browser APIs gracefully.
 * These utilities prevent crashes during initial render when browser APIs are unavailable.
 */

/**
 * Safely get an item from localStorage without throwing.
 * @param key - The localStorage key
 * @param fallback - The fallback value if access fails
 * @returns The stored value or fallback
 */
export function safeLocalStorageGet(key: string, fallback: string = ''): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key) ?? fallback;
    }
  } catch (error) {
    // localStorage access blocked or unavailable
  }
  return fallback;
}

/**
 * Safely set an item in localStorage without throwing.
 * @param key - The localStorage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    // localStorage access blocked or unavailable
  }
  return false;
}

/**
 * Safely get the current hostname without throwing.
 * @param fallback - The fallback value if access fails
 * @returns The hostname or fallback
 */
export function safeGetHostname(fallback: string = 'unknown-app'): string {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.hostname || fallback;
    }
  } catch (error) {
    // window.location access blocked or unavailable
  }
  return fallback;
}

/**
 * Check if the browser environment is available.
 * @returns true if running in a browser with document/window available
 */
export function isBrowserAvailable(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safely check if fullscreen API is supported without throwing.
 * @returns true if fullscreen is supported, false otherwise
 */
export function isFullscreenSupported(): boolean {
  try {
    if (!isBrowserAvailable()) return false;
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  } catch (error) {
    return false;
  }
}
