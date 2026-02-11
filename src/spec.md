# Specification

## Summary
**Goal:** Restore the “Add Control” button to its last known working behavior so it reliably opens (and keeps open) the Add Control modal in Edit mode, and matches prior disabled/loading UX with visible tooltips.

**Planned changes:**
- Revert/repair the shared “Add Control” button click/guard logic so that, when in Edit mode and the layout is initialized and not loading, clicking opens the Add Control modal on the first click (for both the header button and the Import/Export panel “Versions” tab button).
- Fix any modal-open state/guard interactions so the modal does not immediately close due to state flapping; it remains open until the user closes it or successfully creates a control.
- Restore the button’s disabled/loading UX to match the last working version: disable when adding controls is not allowed, show a spinner while the layout is loading, and provide visible/triggerable tooltips that explain why the button is disabled (including cases where the underlying button is disabled, and including in the Versions tab).

**User-visible outcome:** In Edit mode (when initialized and not loading), clicking “Add Control” opens the modal reliably from both locations, and the button clearly indicates loading/disabled states with a spinner and visible explanatory tooltips.
