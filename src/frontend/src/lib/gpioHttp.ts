/**
 * Sends a GPIO signal via HTTP POST with button number (1-16) and state ("on" or "off").
 * Uses no-cors mode to bypass CORS enforcement entirely — the request fires and forgets.
 * Body is sent as plain text JSON since no-cors disallows custom Content-Type headers.
 */
export async function sendGpioSignal(
  decimalCode: number,
  state: "on" | "off",
): Promise<void> {
  const url = "https://7426razpi3.nevadascientific.com/gpio";
  const bodyStr = JSON.stringify({ button: decimalCode, value: state });

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      body: bodyStr,
    });
  } catch (networkError) {
    const message =
      networkError instanceof Error
        ? networkError.message
        : String(networkError);
    throw new Error(
      `Network error — is the GPIO server reachable at 7426razpi3.nevadascientific.com? (${message})`,
    );
  }
}
