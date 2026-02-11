# Specification

## Summary
**Goal:** Make runtime-mode buttons respond reliably to mouse and touch presses, and log/display each button press with both its binary code and button name.

**Planned changes:**
- Update runtime-mode button interactions to use unified pointer-based input so presses work with both mouse and touch, and properly handle leave/cancel to avoid stuck pressed state.
- Preserve existing edit-mode behavior so button presses do not emit signals while editing.
- Extend button press event payloads to include the button name (using the control label) alongside the binary code, and persist this in the backend event log and recent-events responses.
- Update the Recent Signals UI to display both the binary code and button name for button press events, aligned with the updated backend event shape.

**User-visible outcome:** In runtime mode, users can press buttons via mouse or touch without getting stuck, and the Recent Signals log shows each button press with its binary code and the button’s name.
