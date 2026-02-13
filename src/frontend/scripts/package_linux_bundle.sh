#!/usr/bin/env bash
#
# Linux Test Bundle Packaging Script
# Creates a distributable .tar.gz archive containing the built frontend,
# local canister artifacts, launcher script, and Raspberry Pi helper scripts.
#
# Usage:
#   bash frontend/scripts/package_linux_bundle.sh
#
# Output:
#   control-panel-linux-bundle-<timestamp>.tar.gz in the project root
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_error() {
    echo -e "${RED}[✗]${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $*"
}

print_header() {
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  Linux Test Bundle Packager                                ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Detect project root (script is in frontend/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Check if we're in the right place
if [[ ! -f "$PROJECT_ROOT/dfx.json" ]]; then
    log_error "Could not find dfx.json in project root: $PROJECT_ROOT"
    log_error "Please run this script from the project root or ensure the directory structure is correct"
    exit 1
fi

print_header

log "Project root: $PROJECT_ROOT"
log "Frontend directory: $FRONTEND_DIR"
log "Backend directory: $BACKEND_DIR"
echo ""

# Check for required tools
log "Checking dependencies..."
MISSING_DEPS=0

if ! command -v dfx &> /dev/null; then
    log_error "dfx not found - required for building canisters"
    MISSING_DEPS=1
fi

if ! command -v node &> /dev/null; then
    log_error "node not found - required for building frontend"
    MISSING_DEPS=1
fi

if ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null; then
    log_error "npm or pnpm not found - required for building frontend"
    MISSING_DEPS=1
fi

if [[ $MISSING_DEPS -eq 1 ]]; then
    log_error "Missing required dependencies. Please install them and try again."
    exit 1
fi

log_success "All dependencies found"
echo ""

# Create temporary build directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUNDLE_NAME="control-panel-linux-bundle-${TIMESTAMP}"
TEMP_DIR="$PROJECT_ROOT/.bundle_temp/$BUNDLE_NAME"

log "Creating temporary build directory: $TEMP_DIR"
rm -rf "$PROJECT_ROOT/.bundle_temp"
mkdir -p "$TEMP_DIR"

# Build the project
log "Building frontend and backend..."
cd "$PROJECT_ROOT"

# Build backend canister
log "Building backend canister..."
if ! dfx canister create backend --network local 2>/dev/null; then
    log_warning "Backend canister already exists or local replica not running - continuing..."
fi

if ! dfx build backend 2>&1 | grep -v "WARN"; then
    log_error "Backend build failed"
    rm -rf "$PROJECT_ROOT/.bundle_temp"
    exit 1
fi
log_success "Backend built"

# Build frontend
log "Building frontend..."
cd "$FRONTEND_DIR"
if command -v pnpm &> /dev/null; then
    if ! pnpm run build:skip-bindings 2>&1 | tail -20; then
        log_error "Frontend build failed"
        rm -rf "$PROJECT_ROOT/.bundle_temp"
        exit 1
    fi
else
    if ! npm run build:skip-bindings 2>&1 | tail -20; then
        log_error "Frontend build failed"
        rm -rf "$PROJECT_ROOT/.bundle_temp"
        exit 1
    fi
fi
log_success "Frontend built"
echo ""

# Copy built artifacts to bundle
log "Packaging bundle contents..."

# 1. Copy frontend dist
log "  → Copying frontend build..."
mkdir -p "$TEMP_DIR/frontend"
cp -r "$FRONTEND_DIR/dist" "$TEMP_DIR/frontend/"
log_success "    Frontend dist copied"

# 2. Copy backend artifacts
log "  → Copying backend artifacts..."
mkdir -p "$TEMP_DIR/backend"
if [[ -d "$PROJECT_ROOT/.dfx/local/canisters/backend" ]]; then
    cp -r "$PROJECT_ROOT/.dfx/local/canisters/backend" "$TEMP_DIR/backend/"
    log_success "    Backend canister artifacts copied"
else
    log_warning "    Backend canister artifacts not found in .dfx/local - bundle may require rebuild"
fi

# 3. Copy dfx.json and canister_ids.json
log "  → Copying configuration files..."
cp "$PROJECT_ROOT/dfx.json" "$TEMP_DIR/"
if [[ -f "$PROJECT_ROOT/canister_ids.json" ]]; then
    cp "$PROJECT_ROOT/canister_ids.json" "$TEMP_DIR/"
fi
log_success "    Configuration files copied"

# 4. Copy Raspberry Pi scripts
log "  → Copying Raspberry Pi helper scripts..."
mkdir -p "$TEMP_DIR/scripts"
cp "$FRONTEND_DIR/scripts/rpi_event_runner.sh" "$TEMP_DIR/scripts/"
cp "$FRONTEND_DIR/scripts/rpi_pin_test.sh" "$TEMP_DIR/scripts/"
chmod +x "$TEMP_DIR/scripts/rpi_event_runner.sh"
chmod +x "$TEMP_DIR/scripts/rpi_pin_test.sh"
log_success "    Raspberry Pi scripts copied"

# 5. Copy documentation
log "  → Copying documentation..."
mkdir -p "$TEMP_DIR/docs"
cp "$FRONTEND_DIR/docs/rpi-bash-runner.md" "$TEMP_DIR/docs/"
if [[ -f "$FRONTEND_DIR/docs/linux-local-test-bundle.md" ]]; then
    cp "$FRONTEND_DIR/docs/linux-local-test-bundle.md" "$TEMP_DIR/docs/"
fi
log_success "    Documentation copied"

# 6. Copy launcher script
log "  → Copying launcher script..."
cp "$FRONTEND_DIR/scripts/linux_bundle_run.sh" "$TEMP_DIR/run.sh"
chmod +x "$TEMP_DIR/run.sh"
log_success "    Launcher script copied"

# 7. Create README
log "  → Creating bundle README..."
cat > "$TEMP_DIR/README.md" << 'EOF'
# Control Panel Linux Test Bundle

This bundle contains everything you need to run and test the GPIO Control Panel application locally on Linux.

## Quick Start

1. **Extract this archive:**
   ```bash
   tar -xzf control-panel-linux-bundle-*.tar.gz
   cd control-panel-linux-bundle-*
   ```

2. **Run the application:**
   ```bash
   ./run.sh
   ```

3. **Access the application:**
   Open your browser to the URL displayed by the run script (typically http://localhost:4943?canisterId=...)

## What's Included

- `frontend/dist/` - Built frontend application
- `backend/` - Compiled backend canister
- `scripts/` - Raspberry Pi GPIO helper scripts
  - `rpi_event_runner.sh` - Polls backend and executes GPIO commands
  - `rpi_pin_test.sh` - Verifies GPIO pin wiring
- `docs/` - Documentation
  - `linux-local-test-bundle.md` - Full setup and usage guide
  - `rpi-bash-runner.md` - Raspberry Pi GPIO documentation
- `run.sh` - Launcher script (starts local replica and deploys app)

## Prerequisites

- **dfx** (DFINITY SDK) - Install from https://internetcomputer.org/docs/current/developer-docs/setup/install
- **Node.js** (v18+) - For serving the frontend
- **jq** - For JSON parsing (optional, for Raspberry Pi scripts)
- **libgpiod** - For GPIO control on Raspberry Pi (optional, only if using GPIO features)

## Documentation

For detailed instructions, troubleshooting, and Raspberry Pi setup, see:
- `docs/linux-local-test-bundle.md` - Complete Linux testing guide
- `docs/rpi-bash-runner.md` - Raspberry Pi GPIO setup and usage

## Support

For issues or questions, refer to the documentation files included in this bundle.

---

Built with ❤️ using caffeine.ai
EOF
log_success "    README created"

echo ""
log "Creating archive..."
cd "$PROJECT_ROOT/.bundle_temp"
ARCHIVE_NAME="${BUNDLE_NAME}.tar.gz"
tar -czf "$ARCHIVE_NAME" "$BUNDLE_NAME"
mv "$ARCHIVE_NAME" "$PROJECT_ROOT/"

# Cleanup
log "Cleaning up temporary files..."
cd "$PROJECT_ROOT"
rm -rf "$PROJECT_ROOT/.bundle_temp"

# Success!
echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  Bundle created successfully!                              ║${NC}"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
log_success "Archive location: ${BOLD}$PROJECT_ROOT/$ARCHIVE_NAME${NC}"
echo ""
log "Next steps:"
echo "  1. Transfer the archive to your Linux test machine"
echo "  2. Extract: tar -xzf $ARCHIVE_NAME"
echo "  3. Run: cd $BUNDLE_NAME && ./run.sh"
echo ""
log "For Raspberry Pi GPIO testing:"
echo "  - See docs/rpi-bash-runner.md in the extracted bundle"
echo "  - Run scripts/rpi_pin_test.sh to verify GPIO wiring"
echo ""
