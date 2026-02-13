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

# Detect bundle root (script is in bundle root as run.sh)
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're in the right place
if [[ ! -f "$BUNDLE_ROOT/dfx.json" ]]; then
    log_error "Could not find dfx.json in bundle root: $BUNDLE_ROOT"
    log_error "Please run this script from the extracted bundle directory"
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
        echo "Usage: ./run.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no option)    Start the application (default)"
        echo "  --stop         Stop the local replica"
        echo "  --clean        Stop and clean all local state"
        echo "  --help, -h     Show this help message"
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

# Change to bundle directory
cd "$BUNDLE_ROOT"

# Check if replica is already running
if dfx ping 2>/dev/null | grep -q "replica"; then
    log_warning "Local replica is already running"
    log_instruction "If you want to start fresh, run: ./run.sh --clean"
else
    # Start local replica
    log "Starting local Internet Computer replica..."
    log_instruction "This may take a moment on first run..."
    
    if ! dfx start --background --clean 2>&1 | grep -v "WARN" | tail -10; then
        log_error "Failed to start local replica"
        log_instruction "Try running: ./run.sh --clean"
        exit 1
    fi
    
    log_success "Local replica started"
    
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
    if ! dfx canister create backend 2>&1 | grep -v "WARN"; then
        log_error "Failed to create backend canister"
        exit 1
    fi
fi

# Install the backend canister
log "Installing backend canister..."
if [[ -d "$BUNDLE_ROOT/backend/backend" ]]; then
    BACKEND_WASM="$BUNDLE_ROOT/backend/backend/backend.wasm"
    if [[ -f "$BACKEND_WASM" ]]; then
        if ! dfx canister install backend --wasm "$BACKEND_WASM" --mode reinstall --yes 2>&1 | grep -v "WARN"; then
            log_error "Failed to install backend canister"
            exit 1
        fi
        log_success "Backend canister deployed"
    else
        log_error "Backend WASM file not found: $BACKEND_WASM"
        exit 1
    fi
else
    log_error "Backend artifacts not found in bundle"
    exit 1
fi

# Get canister ID
BACKEND_CANISTER_ID=$(dfx canister id backend)
log_success "Backend canister ID: $BACKEND_CANISTER_ID"

echo ""

# Serve frontend
log "Frontend is available in: $BUNDLE_ROOT/frontend/dist"
log_instruction "The frontend is pre-built and ready to serve"

# Get replica URL
REPLICA_URL="http://localhost:4943"
FRONTEND_URL="${REPLICA_URL}?canisterId=${BACKEND_CANISTER_ID}"

echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  Application is ready!                                     ║${NC}"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
log_success "Local replica running at: ${BOLD}$REPLICA_URL${NC}"
log_success "Backend canister ID: ${BOLD}$BACKEND_CANISTER_ID${NC}"
echo ""
log_instruction "To access the application, you have two options:"
echo ""
echo "  ${BOLD}Option 1: Use dfx's built-in server${NC}"
echo "    Run in a new terminal:"
echo "    ${CYAN}cd $BUNDLE_ROOT/frontend/dist && python3 -m http.server 8080${NC}"
echo "    Then open: ${BOLD}http://localhost:8080?canisterId=$BACKEND_CANISTER_ID${NC}"
echo ""
echo "  ${BOLD}Option 2: Deploy frontend canister (recommended)${NC}"
echo "    Run: ${CYAN}dfx deploy frontend${NC}"
echo "    Then open the URL shown by dfx"
echo ""
log_instruction "For Raspberry Pi GPIO testing:"
echo "  1. Verify GPIO wiring: ${CYAN}bash scripts/rpi_pin_test.sh${NC}"
echo "  2. Run event runner: ${CYAN}CANISTER_ID=$BACKEND_CANISTER_ID NETWORK=local bash scripts/rpi_event_runner.sh${NC}"
echo "  3. See docs/rpi-bash-runner.md for detailed instructions"
echo ""
log_instruction "To stop the replica:"
echo "  ${CYAN}./run.sh --stop${NC}"
echo ""
log_instruction "To clean and reset everything:"
echo "  ${CYAN}./run.sh --clean${NC}"
echo ""
