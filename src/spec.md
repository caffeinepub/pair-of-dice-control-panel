# Specification

## Summary
**Goal:** Ensure newly created controls immediately appear in the Control Panel workspace and all control-panel UI stays in sync via a shared control layout state.

**Planned changes:**
- Introduce a shared, single source of truth for control layout and selection state (e.g., a React Context provider) used across Workspace, AddControlModal/CreateControlButton, InspectorPanel, DragController, ControlRenderer, and Import/Export.
- Update control creation so “Add Control” -> “Create” appends the new control into the shared state, causing an immediate render in the workspace and automatic selection in the Inspector.
- Ensure drag/move and Inspector edits both read/write the same shared state so position and property updates reflect immediately across the workspace and Inspector.
- Add minimal defensive checks and user feedback in AddControlModal so creation cannot silently “succeed” if shared state is missing/uninitialized (show an English error message and do not close the modal on failure).

**User-visible outcome:** In Edit mode, creating a control makes it appear instantly in the workspace as a usable control and be selected in the Inspector; moving or editing it stays synchronized everywhere, and failures show a clear error instead of silently doing nothing.
