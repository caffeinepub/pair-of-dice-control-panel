# Specification

## Summary
**Goal:** When Panel Mode is set to Runtime, prevent any control/layout editing while still allowing users to interact with controls and see emitted events in the Recent Signals log.

**Planned changes:**
- In Runtime mode, disable or hide all UI/actions that mutate layouts or control definitions (e.g., import layout, delete controls, save layout, edit attributes, edit-selection affordances).
- In Runtime mode, prevent drag/reposition interactions so controls cannot move and do not appear editable.
- Ensure control interactions (e.g., button pointer down/up) still emit events to the backend and refresh the Recent Signals panel shortly after successful emission (via existing polling and/or query invalidation).
- Adjust control wrapper cursor/interaction handling in Runtime mode to avoid draggable/edit cursor styling while preserving correct pointer interaction with the controls themselves.

**User-visible outcome:** In Runtime mode, users can press/use existing controls and immediately see their outputs appear in Recent Signals, but cannot edit, move, add, delete, or reconfigure controls/layout.
