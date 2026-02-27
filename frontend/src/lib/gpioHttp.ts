/**
 * Sends a GPIO signal via HTTP POST with button number (1-16) and state ("on" or "off").
 * Uses standard cors mode so responses can be inspected and errors properly detected.
 * Includes Content-Type: application/json header and a JSON body of { button, value }.
 */
export async function sendGpioSignal(decimalCode: number, state: 'on' | 'off'): Promise<void> {
  const url = 'http://localhost:3000/gpio';
  const requestBody = { button: decimalCode, value: state };
  const bodyStr = JSON.stringify(requestBody);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyStr,
    });
  } catch (networkError) {
    // Network-level failure (server unreachable, DNS failure, CORS preflight blocked, etc.)
    const message =
      networkError instanceof Error ? networkError.message : String(networkError);
    throw new Error(`Network error — is the GPIO server running at localhost:3000? (${message})`);
  }

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore body read errors
    }
    throw new Error(
      `GPIO server responded with HTTP ${response.status} ${response.statusText}${body ? `: ${body}` : ''}`
    );
  }
}
