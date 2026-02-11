# Specification

## Summary
**Goal:** Make “Add Control” work reliably and open a configuration modal so users can set control properties before creating a new control.

**Planned changes:**
- Change the existing “Add Control” header button to open a modal dialog in Edit mode instead of immediately creating a default control.
- Add an “Add Control” modal with clearly separated sections for configuring: Basic (ID, Label, Control Type), Layout (X, Y, Width, Height), Appearance (Color), Signal (Binary Code), and Type-specific settings.
- Implement type-specific fields in the modal (Slider Min/Max; Radio Group options list with add/remove, each option having label + binary code).
- Add modal confirmation flow: validate inputs (including non-empty, unique ID), then create the control using the configured values, add it to the workspace, and select it; allow cancel/close without creating.
- Fix the current issue preventing controls from being added, ensuring repeated additions work consistently.

**User-visible outcome:** Clicking “Add Control” opens a modal where the user configures a new control and clicks “Create” to add it to the workspace (or cancels/close to add nothing); newly created controls appear with the chosen settings and are selected automatically.
