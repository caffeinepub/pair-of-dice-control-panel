/**
 * Sends a GPIO signal via HTTP POST with button number (1-16) and state ("on" or "off").
 * Uses a Blob body to guarantee Content-Type: application/json is sent correctly.
 */
export async function sendGpioSignal(
  decimalCode: number,
  state: "on" | "off",
): Promise<void> {
  const url = "https://7426razpi3.nevadascientific.com/gpio";
  const jsonString = JSON.stringify({ button: decimalCode, value: state });

  // Using a Blob ensures the Content-Type header is always application/json
  // regardless of CORS mode or browser behavior. Passing a plain string as
  // the body allows the browser to silently downgrade to text/plain.
  const body = new Blob([jsonString], { type: "application/json" });

  try {
    await fetch(url, {
      method: "POST",
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
