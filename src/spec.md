# Specification

## Summary
**Goal:** Provide a downloadable Linux bundle that lets users run and test the app locally with a single command.

**Planned changes:**
- Add a Linux packaging script (e.g., under `scripts/`) that builds the frontend, includes required local canister artifacts, and outputs a single distributable archive (e.g., `.tar.gz`).
- Include a launcher script inside the archive (e.g., `run.sh`) that starts any required local services (e.g., replica) and deploys/serves the app for testing.
- Add/extend Linux testing documentation covering prerequisites, download/extract steps, how to run the launcher script, expected local URL/ports, how to stop/reset, and troubleshooting (with copy-pasteable bash commands).
- Ensure the bundle includes existing Raspberry Pi helper scripts and docs (`frontend/scripts/rpi_event_runner.sh`, `frontend/scripts/rpi_pin_test.sh`, `frontend/docs/rpi-bash-runner.md`) and that the documentation points to their included paths and usage.

**User-visible outcome:** A user can download and extract a single Linux archive, run one script to start the app locally for testing, and access clear Linux/Raspberry Pi testing instructions from the included documentation.
