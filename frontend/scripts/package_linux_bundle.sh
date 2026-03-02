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

# Source diagnostics helper
# shellcheck source=frontend/scripts/lib/script_diagnostics.sh
source "$SCRIPT_DIR/lib/script_diagnostics.sh"

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
    log_error "Install from: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    MISSING_DEPS=1
fi

if ! command -v node &> /dev/null; then
    log_error "node not found - required for building frontend"
    log_error "Install from: https://nodejs.org/"
    MISSING_DEPS=1
fi

if ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null; then
    log_error "npm or pnpm not found - required for building frontend"
    log_error "Install Node.js from: https://nodejs.org/"
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
log "Ensuring backend canister exists..."
if ! dfx canister create backend --network local 2>/dev/null; then
    log_warning "Backend canister already exists or local replica not running - continuing..."
fi

# Build backend with diagnostics
if ! run_step "Backend build" "dfx build backend"; then
    log_error "Backend build failed - see diagnostics above"
    rm -rf "$PROJECT_ROOT/.bundle_temp"
    exit 1
fi

# Build frontend with diagnostics
cd "$FRONTEND_DIR"
if command -v pnpm &> /dev/null; then
    if ! run_step "Frontend build" "pnpm run build:skip-bindings"; then
        log_error "Frontend build failed - see diagnostics above"
        rm -rf "$PROJECT_ROOT/.bundle_temp"
        exit 1
    fi
else
    if ! run_step "Frontend build" "npm run build:skip-bindings"; then
        log_error "Frontend build failed - see diagnostics above"
        rm -rf "$PROJECT_ROOT/.bundle_temp"
        exit 1
    fi
fi

echo ""

# Validate required artifacts before packaging
log "Validating build artifacts..."
VALIDATION_FAILED=0

if [[ ! -d "$FRONTEND_DIR/dist" ]]; then
    log_error "Frontend dist directory not found: $FRONTEND_DIR/dist"
    log_error "Remediation: Ensure frontend build completed successfully"
    VALIDATION_FAILED=1
fi

if [[ ! -d "$PROJECT_ROOT/.dfx/local/canisters/backend" ]]; then
    log_error "Backend canister artifacts not found: $PROJECT_ROOT/.dfx/local/canisters/backend"
    log_error "Remediation: Ensure dfx build backend completed successfully"
    VALIDATION_FAILED=1
fi

BACKEND_WASM="$PROJECT_ROOT/.dfx/local/canisters/backend/backend.wasm"
if [[ ! -f "$BACKEND_WASM" ]]; then
    log_error "Backend WASM file not found: $BACKEND_WASM"
    log_error "Remediation: Run 'dfx build backend' to generate the WASM file"
    VALIDATION_FAILED=1
fi

if [[ $VALIDATION_FAILED -eq 1 ]]; then
    log_error "Build artifact validation failed - cannot create bundle"
    log_error "Please fix the issues above and try again"
    rm -rf "$PROJECT_ROOT/.bundle_temp"
    exit 1
fi

log_success "All required artifacts validated"
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
cp -r "$PROJECT_ROOT/.dfx/local/canisters/backend" "$TEMP_DIR/backend/"
log_success "    Backend canister artifacts copied"

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

# 5. Copy systemd service and environment examples
log "  → Copying systemd configuration examples..."
mkdir -p "$TEMP_DIR/scripts/systemd"
cp "$FRONTEND_DIR/scripts/rpi_event_runner.service.example" "$TEMP_DIR/scripts/systemd/"
cp "$FRONTEND_DIR/scripts/rpi_event_runner.env.example" "$TEMP_DIR/scripts/systemd/"
log_success "    Systemd examples copied"

# 6. Copy documentation
log "  → Copying documentation..."
mkdir -p "$TEMP_DIR/docs"
cp "$FRONTEND_DIR/docs/rpi-bash-runner.md" "$TEMP_DIR/docs/"
if [[ -f "$FRONTEND_DIR/docs/linux-local-test-bundle.md" ]]; then
    cp "$FRONTEND_DIR/docs/linux-local-test-bundle.md" "$TEMP_DIR/docs/"
fi
log_success "    Documentation copied"

# 7. Copy launcher script
log "  → Copying launcher script..."
cp "$FRONTEND_DIR/scripts/linux_bundle_run.sh" "$TEMP_DIR/run.sh"
chmod +x "$TEMP_DIR/run.sh"
log_success "    Launcher script copied"

# 8. Copy INSTALL.md
log "  → Copying INSTALL.md..."
if [[ -f "$FRONTEND_DIR/INSTALL.md" ]]; then
    cp "$FRONTEND_DIR/INSTALL.md" "$TEMP_DIR/INSTALL.md"
    log_success "    INSTALL.md copied"
else
    log_warning "    INSTALL.md not found at $FRONTEND_DIR/INSTALL.md — skipping"
fi

# 9. Create README
log "  → Creating bundle README..."
cat > "$TEMP_DIR/README.md" << 'EOF'
# GPIO Control Panel — Linux Bundle

This bundle contains everything you need to run the GPIO Control Panel on Linux or Raspberry Pi.

## Quick Start

