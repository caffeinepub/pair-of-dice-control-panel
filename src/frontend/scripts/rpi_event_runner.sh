#!/usr/bin/env bash
#
# Raspberry Pi GPIO Event Runner
# Polls the backend canister for recent events and executes GPIO commands locally.
#
# This script is designed to run on a Raspberry Pi with GPIO access.
# It continuously polls the backend for new events and executes whitelisted
# GPIO commands (gpioset) to control physical pins.
#
# Usage:
#   CANISTER_ID=<canister-id> NETWORK=<local|ic> ./rpi_event_runner.sh
#
# Environment Variables:
#   CANISTER_ID     - Required: Backend canister ID
#   NETWORK         - Required: "local" or "ic"
#   DRY_RUN         - Optional: Set to "true" to log commands without executing
#   POLL_INTERVAL   - Optional: Seconds between polls (default: 2)
#   STATE_FILE      - Optional: Path to state file (default: /tmp/rpi_event_runner_state.json)
#   ALLOWED_PREFIX  - Optional: Command prefix whitelist (default: gpioset)
#

set -euo pipefail

# Configuration from environment
CANISTER_ID="${CANISTER_ID:-}"
NETWORK="${NETWORK:-local}"
DRY_RUN="${DRY_RUN:-false}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"
STATE_FILE="${STATE_FILE:-/tmp/rpi_event_runner_state.json}"
ALLOWED_PREFIX="${ALLOWED_PREFIX:-gpioset}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

print_help() {
    cat << EOF
${BOLD}Raspberry Pi GPIO Event Runner${NC}

Polls the backend canister for GPIO events and executes commands locally.

${BOLD}Usage:${NC}
  CANISTER_ID=<id> NETWORK=<network> ./rpi_event_runner.sh

${BOLD}Required Environment Variables:${NC}
  CANISTER_ID     Backend canister ID (get from run.sh output or 'dfx canister id backend')
  NETWORK         Network to connect to: "local" or "ic"

${BOLD}Optional Environment Variables:${NC}
  DRY_RUN         Set to "true" to log commands without executing (default: false)
  POLL_INTERVAL   Seconds between polls (default: 2)
  STATE_FILE      Path to state file for tracking processed events (default: /tmp/rpi_event_runner_state.json)
  ALLOWED_PREFIX  Command prefix whitelist for security (default: gpioset)

${BOLD}Examples:${NC}
  # Run against local replica
  CANISTER_ID=bkyz2-fmaaa-aaaaa-qaaaq-cai NETWORK=local ./rpi_event_runner.sh

  # Run in dry-run mode (no GPIO execution)
  CANISTER_ID=bkyz2-fmaaa-aaaaa-qaaaq-cai NETWORK=local DRY_RUN=true ./rpi_event_runner.sh

  # Run against IC mainnet
  CANISTER_ID=your-mainnet-canister-id NETWORK=ic ./rpi_event_runner.sh

${BOLD}Prerequisites:${NC}
  - jq (JSON parser): sudo apt-get install -y jq
  - libgpiod (GPIO tools): sudo apt-get install -y gpiod
  - dfx (DFINITY SDK): https://internetcomputer.org/docs/current/developer-docs/setup/install

${BOLD}Documentation:${NC}
  See docs/rpi-bash-runner.md for complete setup instructions and systemd configuration.

EOF
}

# Check for help flag
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    print_help
    exit 0
fi

# Validate required environment variables
if [[ -z "$CANISTER_ID" ]]; then
    log_error "CANISTER_ID environment variable is required"
    echo ""
    print_help
    exit 1
fi

if [[ "$NETWORK" != "local" ]] && [[ "$NETWORK" != "ic" ]]; then
    log_error "NETWORK must be 'local' or 'ic', got: $NETWORK"
    echo ""
    print_help
    exit 1
fi

# Check for required tools
log "Checking prerequisites..."
MISSING_TOOLS=0

if ! command -v jq &> /dev/null; then
    log_error "jq not found - required for JSON parsing"
    log_error "Install: sudo apt-get install -y jq"
    MISSING_TOOLS=1
fi

if ! command -v dfx &> /dev/null; then
    log_error "dfx not found - required for canister communication"
    log_error "Install from: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    MISSING_TOOLS=1
fi

if [[ "$DRY_RUN" != "true" ]]; then
    if ! command -v gpioset &> /dev/null; then
        log_warning "gpioset not found - GPIO commands will fail"
        log_warning "Install: sudo apt-get install -y gpiod"
        log_warning "Continuing anyway (set DRY_RUN=true to test without GPIO)"
    fi
fi

if [[ $MISSING_TOOLS -eq 1 ]]; then
    log_error "Missing required tools. Please install them and try again."
    exit 1
fi

log_success "All prerequisites found"

# Print startup banner
echo ""
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║  Raspberry Pi GPIO Event Runner                            ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
log "Canister ID: $CANISTER_ID"
log "Network: $NETWORK"
log "Poll interval: ${POLL_INTERVAL}s"
log "State file: $STATE_FILE"
log "Dry-run mode: $DRY_RUN"
log "Allowed command prefix: $ALLOWED_PREFIX"
echo ""

# Initialize state file if it doesn't exist
if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"lastProcessedTimestamp": 0}' > "$STATE_FILE"
    log "Initialized state file: $STATE_FILE"
fi

# Main polling loop
log "Starting event polling..."
echo ""

while true; do
    # Fetch recent events from backend
    EVENTS_JSON=$(dfx canister call "$CANISTER_ID" getRecentEvents --network "$NETWORK" 2>/dev/null || echo "[]")
    
    # Parse events
    EVENT_COUNT=$(echo "$EVENTS_JSON" | jq 'length' 2>/dev/null || echo "0")
    
    if [[ "$EVENT_COUNT" -gt 0 ]]; then
        log "Fetched $EVENT_COUNT events"
        
        # Get last processed timestamp
        LAST_TIMESTAMP=$(jq -r '.lastProcessedTimestamp' "$STATE_FILE" 2>/dev/null || echo "0")
        
        # Process each event
        echo "$EVENTS_JSON" | jq -c '.[]' | while read -r event; do
            TIMESTAMP=$(echo "$event" | jq -r '.timestamp')
            CONTROL_ID=$(echo "$event" | jq -r '.controlId')
            CONTROL_TYPE=$(echo "$event" | jq -r '.controlType')
            CONTROL_NAME=$(echo "$event" | jq -r '.controlName // "unnamed"')
            VALUE=$(echo "$event" | jq -r '.value')
            BINARY_CODE=$(echo "$event" | jq -r '.binaryCode')
            
            # Skip if already processed
            if [[ "$TIMESTAMP" -le "$LAST_TIMESTAMP" ]]; then
                continue
            fi
            
            log "Processing event: $CONTROL_NAME ($CONTROL_TYPE) - $BINARY_CODE"
            
            # Parse and execute commands from value field
            while IFS= read -r cmd; do
                # Skip empty lines
                [[ -z "$cmd" ]] && continue
                
                # Security check: only allow whitelisted commands
                if [[ ! "$cmd" =~ ^$ALLOWED_PREFIX ]]; then
                    log_warning "Skipping non-whitelisted command: $cmd"
                    continue
                fi
                
                # Execute or log command
                if [[ "$DRY_RUN" == "true" ]]; then
                    log "[DRY-RUN] Would execute: $cmd"
                else
                    log "Executing: $cmd"
                    if eval "$cmd" 2>&1; then
                        log_success "Command executed successfully"
                    else
                        log_error "Command failed: $cmd"
                    fi
                fi
            done <<< "$VALUE"
            
            # Update last processed timestamp
            echo "{\"lastProcessedTimestamp\": $TIMESTAMP}" > "$STATE_FILE"
        done
    fi
    
    # Wait before next poll
    sleep "$POLL_INTERVAL"
done
