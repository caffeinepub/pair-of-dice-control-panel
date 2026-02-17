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
    echo -e "${BOLD}${CYAN}║  GPIO Control Panel - Linux Test Launcher                 ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Simple run_step function for launcher (doesn't need full diagnostics helper)
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
        echo -e "${RED}║  DEPLOYMENT STEP FAILED                                    ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BOLD}Step:${NC} $step_name"
        echo -e "${BOLD}Command:${NC} $cmd"
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

# Detect bundle root (script is in bundle root as run.sh)
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're in the right place
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
        dfx stop
        rm -rf .dfx
        log_success "Local state cleaned"
        log_instruction "Run ./run.sh again to start fresh"
        exit 0
        ;;
    --help|-h)
        echo "GPIO Control Panel - Linux Bundle Launcher"
        echo ""
        echo "Usage: ./run.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no option)    Start the application (default)"
        echo "  --stop         Stop the local replica"
        echo "  --clean        Stop and clean all local state"
        echo "  --help, -h     Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run.sh                # Start the app"
        echo "  ./run.sh --stop         # Stop the replica"
        echo "  ./run.sh --clean        # Clean and reset"
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
    log_instruction "Install dfx from: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    MISSING_DEPS=1
fi

if ! command -v node &> /dev/null; then
    log_error "node not found"
    log_instruction "Install Node.js (v18+) from: https://nodejs.org/"
    MISSING_DEPS=1
fi

if [[ $MISSING_DEPS -eq 1 ]]; then
    log_error "Missing required dependencies. Please install them and try again."
    exit 1
fi

log_success "All dependencies found"
echo ""

# Validate bundle contents before attempting deployment
log "Validating bundle contents..."
VALIDATION_FAILED=0

if [[ ! -f "$BUNDLE_ROOT/dfx.json" ]]; then
    log_error "dfx.json not found in bundle"
    log_instruction "Remediation: Re-extract the bundle archive or repackage the bundle"
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
    log_error "Bundle validation failed - cannot deploy"
    log_error "Please fix the issues above and try again"
    exit 1
fi

log_success "Bundle contents validated"
echo ""

# Change to bundle directory
cd "$BUNDLE_ROOT"

# Check if replica is already running
if dfx ping 2>/dev/null | grep -q "replica"; then
    log_warning "Local replica is already running"
    log_instruction "Reusing existing replica (use './run.sh --clean' to start fresh)"
else
    # Start local replica
    log "Starting local Internet Computer replica..."
    log_instruction "This may take a moment on first run..."
    
    if ! run_step "Start local replica" "dfx start --background --clean"; then
        log_error "Failed to start local replica - see diagnostics above"
        log_instruction "Remediation: Try running './run.sh --clean' and then './run.sh' again"
        exit 1
    fi
    
    # Wait for replica to be ready
    log "Waiting for replica to be ready..."
    sleep 3
fi

echo ""

# Deploy backend canister
log "Deploying backend canister..."

# Create canister if needed
if ! dfx canister id backend 2>/dev/null; then
    log "Creating backend canister..."
    if ! run_step "Create backend canister" "dfx canister create backend"; then
        log_error "Failed to create backend canister - see diagnostics above"
        log_instruction "Remediation: Check that dfx is running correctly with 'dfx ping'"
        exit 1
    fi
fi

# Install the backend canister
log "Installing backend canister..."
if ! run_step "Install backend canister" "dfx canister install backend --wasm '$BACKEND_WASM' --mode reinstall --yes"; then
    log_error "Failed to install backend canister - see diagnostics above"
    log_instruction "Remediation: Verify the WASM file exists at: $BACKEND_WASM"
    exit 1
fi

# Get canister ID
BACKEND_CANISTER_ID=$(dfx canister id backend)
log_success "Backend canister ID: $BACKEND_CANISTER_ID"

echo ""

# Get replica URL
REPLICA_URL="http://localhost:4943"
FRONTEND_URL="${REPLICA_URL}?canisterId=${BACKEND_CANISTER_ID}"

# Success!
echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  Application deployed successfully!                        ║${NC}"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_success "Backend Canister ID: ${BOLD}${BACKEND_CANISTER_ID}${NC}"
echo ""

# Print access instructions
echo -e "${BOLD}${CYAN}Access the application:${NC}"
echo ""
echo -e "${BOLD}1. Serve the frontend:${NC}"
echo -e "   ${CYAN}cd $BUNDLE_ROOT/frontend/dist && npx http-server -p 3000${NC}"
echo ""
echo -e "${BOLD}2. Open in browser:${NC}"
echo -e "   ${CYAN}${FRONTEND_URL}${NC}"
echo ""

# Print Raspberry Pi instructions
echo -e "${BOLD}${CYAN}Raspberry Pi GPIO Setup (optional):${NC}"
echo ""
echo -e "${BOLD}1. Install prerequisites:${NC}"
echo -e "   ${CYAN}sudo apt-get update && sudo apt-get install -y jq gpiod${NC}"
echo ""
echo -e "${BOLD}2. Test GPIO pins:${NC}"
echo -e "   ${CYAN}./scripts/rpi_pin_test.sh${NC}"
echo ""
echo -e "${BOLD}3. Run event runner (manual):${NC}"
echo -e "   ${CYAN}CANISTER_ID=${BACKEND_CANISTER_ID} NETWORK=local ./scripts/rpi_event_runner.sh${NC}"
echo ""
echo -e "${BOLD}4. Optional: Set up auto-start at boot${NC}"
echo -e "   See ${CYAN}docs/rpi-bash-runner.md${NC} for systemd setup instructions"
echo ""

# Print control commands
echo -e "${BOLD}${CYAN}Control commands:${NC}"
echo ""
echo -e "  ${BOLD}Stop replica:${NC}      ${CYAN}./run.sh --stop${NC}"
echo -e "  ${BOLD}Clean and reset:${NC}   ${CYAN}./run.sh --clean${NC}"
echo -e "  ${BOLD}Show help:${NC}         ${CYAN}./run.sh --help${NC}"
echo ""
