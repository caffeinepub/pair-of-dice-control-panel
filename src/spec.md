# Specification

## Summary
**Goal:** Improve Radio Group controls with larger clickable option targets, configurable orientation, and selection events that appear in Recent Signals.

**Planned changes:**
- Update the Radio Group renderer so each option’s full visual button area is clickable in Runtime mode, while keeping existing selected/unselected styling and maintaining Edit mode non-interactivity.
- Add a per-radio-control orientation setting (Vertical/Horizontal), persist it via backend layout saving/loading, and render options accordingly (column vs row).
- Expose the orientation setting in the Inspector for existing Radio Group controls and in the Add Control modal for new Radio Group controls, using English labels and updating the workspace preview immediately.
- Emit a selection event when a radio option is chosen in Runtime mode so it appears in Recent Signals with controlId, controlType = "radio", and a value representing the selected option, using the option’s binary code for the emitted signal.

**User-visible outcome:** Users can click anywhere on a radio option’s button area to select it (in Runtime), choose whether radio options display vertically or horizontally (and have it persist), and see radio selections logged in Recent Signals with the selected option’s binary-coded value.
