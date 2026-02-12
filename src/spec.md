# Specification

## Summary
**Goal:** Add clearly marked frontend and backend scaffold sections where the user can safely extend the app with custom code.

**Planned changes:**
- Create a new dedicated frontend React/TypeScript scaffold component (with clear BEGIN/END user-code comment delimiters, TODO markers, and a minimal placeholder UI) and export it for reuse.
- Render the new frontend scaffold component within an existing Control Panel screen in a sensible location, without disrupting existing Edit/Interact mode behavior or other control panel features.
- Add a clearly labeled user-code scaffold section in `backend/main.mo`, including at least one harmless placeholder canister method (query/shared) that returns a static value and does not affect existing backend behavior.

**User-visible outcome:** The running app shows a new “custom code” section in the Control Panel UI, and the backend exposes a simple placeholder method—both serving as safe starting points for the user to add their own logic.
