/**
 * Sends a GPIO signal via HTTP POST with decimal code (1-16) and state ("on" or "off").
 */
export async function sendGpioSignal(decimalCode: number, state: 'on' | 'off'): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/gpio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decimalCode, value: state }),
    });

    if (!response.ok) {
      console.error('GPIO HTTP request failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Failed to send GPIO signal:', error);
  }
}
