#!/usr/bin/env bash
#
# Linux Bundle Launcher Script
# Starts a local Internet Computer replica, deploys the control panel application,
# and provides access instructions.
#
# This script is included in the distributable Linux test bundle.
#
# Usage:
#   ./run.sh              # Start the application
#   ./run.sh --stop       # Stop the local replica
#   ./run.sh --clean      # Stop and clean all local state
#   ./run.sh --help       # Show help message
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

log_instruction() {
    echo -e "${CYAN}[→]${NC} $*"
}

print_header() {
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  GPIO Control Panel — Linux Launcher                      ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# run_step: execute a command, show diagnostics on failure
run_step() {
    local step_name="$1"
    shift
    local cmd="$*"

    local log_file
    log_file=$(mktemp)

    echo -e "${BLUE}[INFO]${NC} Running: $step_name"

    if eval "$cmd" > "$log_file" 2>&1; then
        echo -e "${GREEN}[✓]${NC} $step_name completed successfully"
        rm -f "$log_file"
        return 0
    else
        local exit_code=$?
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  STEP FAILED                                               ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BOLD}Step:${NC}      $step_name"
        echo -e "${BOLD}Command:${NC}   $cmd"
        echo -e "${BOLD}Exit Code:${NC} $exit_code"
        echo ""
        echo -e "${BOLD}Last 100 lines of output:${NC}"
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        tail -100 "$log_file"
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        echo ""
        echo -e "${YELLOW}[⚠]${NC} Check the output above for error details"
        echo ""

        rm -f "$log_file"
        return $exit_code
    fi
}

# Detect bundle root (script lives in bundle root as run.sh)
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check we're in the right place
if [[ ! -f "$BUNDLE_ROOT/dfx.json" ]]; then
    log_error "Could not find dfx.json in bundle root: $BUNDLE_ROOT"
    log_error "Please run this script from the extracted bundle directory"
    log_instruction "Remediation: Extract the bundle archive and run ./run.sh from the extracted directory"
    exit 1
fi

# Parse command line arguments
COMMAND="${1:-start}"

case "$COMMAND" in
    --stop)
        log "Stopping local replica..."
        cd "$BUNDLE_ROOT"
        dfx stop
        log_success "Local replica stopped"
        exit 0
        ;;
    --clean)
        log "Stopping and cleaning local state..."
        cd "$BUNDLE_ROOT"
        dfx stop 2>/dev/null || true
        rm -rf .dfx
        log_success "Local state cleaned"
        log_instruction "Run ./run.sh again to start fresh"
        exit 0
        ;;
    --help|-h)
        echo "GPIO Control Panel — Linux Bundle Launcher"
        echo ""
        echo "Usage: ./run.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no option)    Start the application (default)"
        echo "  --stop         Stop the local ICP replica"
        echo "  --clean        Stop replica and remove all local state"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run.sh                # Start the app"
        echo "  ./run.sh --stop         # Stop the replica"
        echo "  ./run.sh --clean        # Clean and reset everything"
        echo ""
        echo "After starting, serve the frontend with one of:"
        echo "  npx http-server frontend/dist -p 8080 --cors"
        echo "  python3 -m http.server 8080  (from frontend/dist/)"
        echo "  Apache: copy frontend/dist/* to your web root"
        echo ""
        echo "See INSTALL.md for full setup instructions."
        echo ""
        exit 0
        ;;
    start)
        # Continue to main script
        ;;
    *)
        log_error "Unknown option: $COMMAND"
        log_instruction "Run ./run.sh --help for usage information"
        exit 1
        ;;
esac

print_header

log "Bundle root: $BUNDLE_ROOT"
echo ""

# Check for required tools
log "Checking dependencies..."
MISSING_DEPS=0

if ! command -v dfx &> /dev/null; then
    log_error "dfx not found"
    log_instruction "Install dfx: sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    MISSING_DEPS=1
fi

if ! command -v node &> /dev/null; then
    log_error "node not found"
    log_instruction "Install Node.js (v18+) from: https://nodejs.org/"
    MISSING_DEPS=1
fi

if [[ $MISSING_DEPS -eq 1 ]]; then
    log_error "Missing required dependencies. Please install them and try again."
    log_instruction "See INSTALL.md for detailed prerequisite installation instructions."
    exit 1
fi

log_success "All dependencies found"
echo ""

# Validate bundle contents before attempting deployment
log "Validating bundle contents..."
VALIDATION_FAILED=0

if [[ ! -f "$BUNDLE_ROOT/dfx.json" ]]; then
    log_error "dfx.json not found in bundle"
    log_instruction "Remediation: Re-extract the bundle archive"
    VALIDATION_FAILED=1
fi

if [[ ! -d "$BUNDLE_ROOT/frontend/dist" ]]; then
    log_error "Frontend dist directory not found: $BUNDLE_ROOT/frontend/dist"
    log_instruction "Remediation: Repackage the bundle with 'bash frontend/scripts/package_linux_bundle.sh'"
    VALIDATION_FAILED=1
fi

if [[ ! -d "$BUNDLE_ROOT/backend/backend" ]]; then
    log_error "Backend artifacts directory not found: $BUNDLE_ROOT/backend/backend"
    log_instruction "Remediation: Repackage the bundle with 'bash frontend/scripts/package_linux_bundle.sh'"
    VALIDATION_FAILED=1
fi

BACKEND_WASM="$BUNDLE_ROOT/backend/backend/backend.wasm"
if [[ ! -f "$BACKEND_WASM" ]]; then
    log_error "Backend WASM file not found: $BACKEND_WASM"
    log_instruction "Remediation: Repackage the bundle with 'bash frontend/scripts/package_linux_bundle.sh'"
    VALIDATION_FAILED=1
fi

if [[ $VALIDATION_FAILED -eq 1 ]]; then
    log_error "Bundle validation failed — cannot deploy"
    log_error "Please fix the issues above and try again"
    exit 1
fi

log_success "Bundle contents validated"
echo ""

# Change to bundle directory
cd "$BUNDLE_ROOT"

# Check if replica is already running
REPLICA_RUNNING=0
if dfx ping 2>/dev/null | grep -q "replica_health_status"; then
    REPLICA_RUNNING=1
    log_warning "Local replica is already running"
    log_instruction "Reusing existing replica (use './run.sh --clean' to start fresh)"
elif dfx ping 2>/dev/null; then
    REPLICA_RUNNING=1
    log_warning "Local replica is already running"
    log_instruction "Reusing existing replica (use './run.sh --clean' to start fresh)"
fi

if [[ $REPLICA_RUNNING -eq 0 ]]; then
    # Start local replica
    log "Starting local Internet Computer replica..."
    log_instruction "This may take a moment on first run..."

    if ! run_step "Start local replica" "dfx start --background --clean"; then
        log_error "Failed to start local replica — see diagnostics above"
        log_instruction "Remediation: Try running './run.sh --clean' and then './run.sh' again"
        exit 1
    fi

    # Wait for replica to be ready
    log "Waiting for replica to be ready..."
    sleep 5
fi

echo ""

# Deploy backend canister
log "Deploying backend canister..."

# Create canister if needed
if ! dfx canister id backend 2>/dev/null; then
    log "Creating backend canister..."
    if ! run_step "Create backend canister" "dfx canister create backend"; then
        log_error "Failed to create backend canister — see diagnostics above"
        log_instruction "Remediation: Check that dfx is running correctly with 'dfx ping'"
        exit 1
    fi
fi

# Install the backend canister
log "Installing backend canister from WASM..."
if ! run_step "Install backend canister" "dfx canister install backend --wasm '$BACKEND_WASM' --mode reinstall --yes"; then
    log_error "Failed to install backend canister — see diagnostics above"
    log_instruction "Remediation: Verify the WASM file exists at: $BACKEND_WASM"
    exit 1
fi

# Get canister ID
BACKEND_CANISTER_ID=$(dfx canister id backend)
log_success "Backend canister deployed — ID: ${BOLD}${BACKEND_CANISTER_ID}${NC}"

echo ""

# Determine replica URL
REPLICA_URL="http://localhost:4943"

# Success banner
echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  Application deployed successfully!                        ║${NC}"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_success "Backend Canister ID: ${BOLD}${BACKEND_CANISTER_ID}${NC}"
log_success "Replica URL:         ${BOLD}${REPLICA_URL}${NC}"
echo ""

# ── Serve the frontend ──────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}┌─ Serve the Frontend ──────────────────────────────────────┐${NC}"
echo ""
echo -e "  ${BOLD}Option A — Node.js (quick, no install needed):${NC}"
echo -e "  ${CYAN}npx http-server $BUNDLE_ROOT/frontend/dist -p 8080 --cors${NC}"
echo -e "  Then open: ${CYAN}http://localhost:8080${NC}"
echo ""
echo -e "  ${BOLD}Option B — Python (no extra installs):${NC}"
echo -e "  ${CYAN}cd $BUNDLE_ROOT/frontend/dist && python3 -m http.server 8080${NC}"
echo -e "  Then open: ${CYAN}http://localhost:8080${NC}"
echo ""
echo -e "  ${BOLD}Option C — Apache (production-like):${NC}"
echo -e "  ${CYAN}sudo cp -r $BUNDLE_ROOT/frontend/dist/* /var/www/html/${NC}"
echo -e "  ${CYAN}sudo systemctl reload apache2${NC}"
echo -e "  Then open: ${CYAN}http://localhost/${NC}"
echo ""
echo -e "${BOLD}${CYAN}└───────────────────────────────────────────────────────────┘${NC}"
echo ""

# ── GPIO server ─────────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}┌─ GPIO Server (required for hardware control) ──────────────┐${NC}"
echo ""
echo -e "  The app sends GPIO signals to ${CYAN}http://localhost:3000/gpio${NC}"
echo -e "  Start your GPIO server before using the control panel."
echo ""
echo -e "  ${BOLD}Raspberry Pi event runner:${NC}"
echo -e "  ${CYAN}CANISTER_ID=${BACKEND_CANISTER_ID} NETWORK=local \\"
echo -e "    $BUNDLE_ROOT/scripts/rpi_event_runner.sh${NC}"
echo ""
echo -e "  ${BOLD}Test GPIO pins:${NC}"
echo -e "  ${CYAN}$BUNDLE_ROOT/scripts/rpi_pin_test.sh${NC}"
echo ""
echo -e "  ${BOLD}Optional — auto-start at boot (systemd):${NC}"
echo -e "  See ${CYAN}$BUNDLE_ROOT/docs/rpi-bash-runner.md${NC}"
echo ""
echo -e "${BOLD}${CYAN}└───────────────────────────────────────────────────────────┘${NC}"
echo ""

# ── Control commands ─────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}┌─ Control Commands ────────────────────────────────────────┐${NC}"
echo ""
echo -e "  ${BOLD}Stop replica:${NC}      ${CYAN}./run.sh --stop${NC}"
echo -e "  ${BOLD}Clean and reset:${NC}   ${CYAN}./run.sh --clean${NC}"
echo -e "  ${BOLD}Show help:${NC}         ${CYAN}./run.sh --help${NC}"
echo ""
echo -e "  ${BOLD}Full setup guide:${NC}  ${CYAN}$BUNDLE_ROOT/INSTALL.md${NC}"
echo ""
echo -e "${BOLD}${CYAN}└───────────────────────────────────────────────────────────┘${NC}"
echo ""
