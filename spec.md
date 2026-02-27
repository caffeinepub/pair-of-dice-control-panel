# Specification

## Summary
**Goal:** Fix failing HTTP POST fetch requests in the GPIO frontend so that requests to `localhost:3000/gpio` succeed reliably and errors are surfaced clearly to the user.

**Planned changes:**
- Fix fetch configuration in `gpioHttp.ts` (e.g., resolve `no-cors` mode issues, correct headers, request body serialization, and error handling) so POST requests to `localhost:3000/gpio` succeed
- Surface fetch errors with meaningful messages via toast notifications instead of silently failing
- Fix the `DebugHttpPanel` send button so it correctly fires the HTTP POST request and displays success or failure results in the panel UI
- Ensure the `DebugHttpPanel` button does not remain stuck in a loading/disabled state after a failed request

**User-visible outcome:** GPIO button controls and the DebugHttpPanel send button successfully POST to `localhost:3000/gpio`. Network errors or failures are shown as clear messages in the UI via toast notifications and within the DebugHttpPanel.
