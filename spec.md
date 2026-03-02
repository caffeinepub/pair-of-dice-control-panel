# Specification

## Summary
**Goal:** Package the GPIO Control Panel as a self-contained bundle that can be deployed and run on a local Linux machine with Apache and dfx.

**Planned changes:**
- Update Vite build config to use a relative base path (`./`) so all asset references are relative in the built `dist/` output
- Update the GPIO HTTP endpoint in `gpioHttp.ts` to use `http://localhost:3000` (plain HTTP, no TLS)
- Update `linux_bundle_run.sh` and `package_linux_bundle.sh` scripts to bundle the built frontend `dist/`, backend canister artifacts, `dfx.json`, an Apache vhost config example, and `rpi_event_runner.sh` into a timestamped `.tar.gz` file
- Include a top-level `INSTALL.md` inside the bundle with Linux setup instructions
- Create or update `frontend/docs/linux-local-test-bundle.md` with a full Linux installation guide covering prerequisites, Apache vhost setup, dfx replica startup, GPIO server startup, and a troubleshooting section

**User-visible outcome:** Users can run `./scripts/package_linux_bundle.sh` to produce a `.tar.gz` bundle, extract it on a fresh Linux machine, follow the included instructions, and access a fully working GPIO Control Panel in their browser via a locally served Apache site.
