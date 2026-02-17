/**
 * Sends a GPIO signal via HTTP POST to localhost:3000/gpio
 * @param binaryCode - 4-bit binary code string (e.g., "1010" or "0000")
 */
export async function sendGpioPost(binaryCode: string): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/gpio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ binary: binaryCode }),
    });

    if (!response.ok) {
      console.warn(
        `GPIO POST failed: HTTP ${response.status} ${response.statusText} | URL: http://localhost:3000/gpio | Binary: ${binaryCode}`
      );
    }
  } catch (error) {
    console.warn(
      `GPIO POST network error: ${error instanceof Error ? error.message : String(error)} | URL: http://localhost:3000/gpio | Binary: ${binaryCode}`
    );
  }
}
