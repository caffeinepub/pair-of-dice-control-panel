# Specification

## Summary
**Goal:** Constrain all binary codes across the app to exactly 4-bit binary strings and enforce this consistently in the UI, import flow, and backend persistence.

**Planned changes:**
- Update binary code validation to accept only 4-character strings containing only `0`/`1`, with all user-facing validation messages in English.
- Change default binary code generation so new controls and new radio options start with deterministic 4-bit codes (no 8-bit defaults anywhere in the UI).
- Constrain binary code inputs to a maximum of 4 characters in relevant UI surfaces (Add Control modal, Inspector panel, and radio option editors) and block create/update/import when codes are not exactly 4 bits.
- Add/adjust layout import validation to reject any non-4-bit control or radio option binary codes with clear validation errors.
- Add backend validation so saving layouts (and any emitted event recording, if applicable) rejects any binaryCode values that are not exactly 4-bit binary strings.

**User-visible outcome:** Users can only enter, generate, import, and save layouts with binary codes that are exactly 4 bits (e.g., `0101`), and any invalid codes are blocked with clear English error messages.
