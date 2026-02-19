# Specification

## Summary
**Goal:** Replace GPIO command execution with HTTP POST requests to a local endpoint.

**Planned changes:**
- Replace gpioset command execution in ControlRenderer with HTTP POST requests to http://localhost:3000/gpio
- Send button decimal code and "on" value when button is pressed
- Send button decimal code and "off" value when button is released
- Update gpioHttp.ts utility to support sending both decimal code and state value in POST payload

**User-visible outcome:** Button interactions will send HTTP requests instead of executing GPIO commands, enabling remote control without changing the UI behavior.
