# Specification

## Summary
**Goal:** Send GPIO HTTP POST updates when a UI button is pressed and immediately reset to `0000` when the press is released.

**Planned changes:**
- On button press (pointer down or keyboard activation), POST to `http://localhost:3000/gpio` with `Content-Type: application/json` and body `{"binary":"XXXX"}` using the button’s 4-bit code (skip sending while in edit mode; keep existing invalid-code validation behavior).
- On button release (pointer up/cancel/leave, blur while pressed, or keyboard key-up), immediately POST `{"binary":"0000"}` exactly once and remove/cancel any prior delayed reset behavior that could trigger extra resets.
- Add basic client-side error handling so failed POSTs don’t crash the UI and log a clear console warning/error including the endpoint and attempted binary value.

**User-visible outcome:** Pressing a button sends its 4-bit binary value to the GPIO endpoint, and releasing it immediately sends `0000` without extra delayed resets; network failures won’t break the UI and will be logged to the console.
