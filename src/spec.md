# Specification

## Summary
**Goal:** Add a Raspberry Pi (Linux) runnable distribution workflow that packages the app into a self-contained bundle with clear scripts and documentation for running locally and executing GPIO helpers.

**Planned changes:**
- Add a packaging workflow/script that produces a single `.tar.gz` Linux bundle containing the built frontend output, bundled backend canister artifacts (WASM), a launcher script, and Raspberry Pi helper scripts.
- Add a single-command launcher script in the bundle that starts/reuses a local replica, installs the backend from the bundled artifacts, prints the canister ID and local UI access instructions, and supports `stop` and `clean` actions with help text.
- Add bundle documentation for Raspberry Pi GPIO execution via an included event runner script, including required environment variables, network selection, and a safe `DRY_RUN` mode.
- Include an optional “run at boot” setup path by providing a documented `systemd` service unit example (and small helper script if needed) for automatically starting the Raspberry Pi event runner.

**User-visible outcome:** The user can generate a `.tar.gz` bundle, extract it on a Raspberry Pi (Linux), start the app with one command (with printed local access info), run GPIO event helpers with documented commands (including dry-run), and optionally set the GPIO runner to start at boot via a provided systemd example.
