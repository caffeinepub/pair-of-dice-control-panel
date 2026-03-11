/**
 * Sends a GPIO signal via HTTP POST with button number (1-16) and state ("on" or "off").
 * Uses no-cors mode so the browser fires the request without requiring
 * Access-Control-Allow-Origin headers from the server.
 * The body is sent as a Blob to preserve the application/json content-type.
 */
export async function sendGpioSignal(
  decimalCode: number,
  state: "on" | "off",
): Promise<void> {
  const url = "https://7426razpi3.nevadascientific.com/gpio";
  const jsonString = JSON.stringify({ button: decimalCode, value: state });

  // Blob body preserves the content-type in the actual HTTP request bytes.
  // mode: "no-cors" tells the browser to send the request regardless of
  // whether the server returns CORS headers — the response is opaque but
  // the POST is delivered.
  const body = new Blob([jsonString], { type: "application/json" });

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      body,
    });
  } catch (networkError) {
    const message =
      networkError instanceof Error
        ? networkError.message
        : String(networkError);
    throw new Error(
      `Network error — is the GPIO server running at 7426razpi3.nevadascientific.com? (${message})`,
    );
  }
}
