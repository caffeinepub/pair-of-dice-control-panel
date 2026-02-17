# Specification

## Summary
**Goal:** Update button press/release event emission to output a single `gpioset -c gpiochip0 <id>=<state>` command using the button’s configured numeric code (1–16).

**Planned changes:**
- Change button interact-mode press/release handlers to emit `gpioset -c gpiochip0 <N>=1` on press and `gpioset -c gpiochip0 <N>=0` on release across pointer and keyboard paths.
- Derive `<N>` from the existing button code configuration (1–16) and emit only when valid; otherwise do not emit and log a console warning.
- Add/update a reusable gpioset command helper to generate exactly `gpioset -c gpiochip0 <id>=<state>` and stop using the old 4-bit multi-pin mapping generator for button events.
- Update `frontend/docs/rpi-bash-runner.md` to reflect the new single-command button press/release format and remove references to 4-line pin-mapping sequences for button events.

**User-visible outcome:** In interact mode, pressing or releasing a button emits a single `gpioset -c gpiochip0 <id>=<state>` command (1 on press, 0 on release) using the button’s configured code (1–16).
