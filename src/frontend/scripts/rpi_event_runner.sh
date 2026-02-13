#!/usr/bin/env bash
#
# Raspberry Pi Event Runner
# Polls the backend canister for recent events and executes GPIO commands locally.
#
# Usage:
#   DRY_RUN=1 bash scripts/rpi_event_runner.sh  # Test mode (print commands without executing)
#   bash scripts/rpi_event_runner.sh            # Execute mode
#
# Configuration via environment variables:
#   CANISTER_ID       - Backend canister ID (required)
#   NETWORK           - Network to use: "local" or "ic" (default: "ic")
#   POLL_INTERVAL     - Seconds between polls (default: 5)
#   STATE_FILE        - Path to state file for tracking processed events (default: /tmp/rpi_event_runner_state)
#   DRY_RUN           - Set to 1 to print commands without executing (default: 0)
#   ALLOWED_PREFIX    - Command prefix whitelist (default: "gpioset")
#

set -euo pipefail

# Configuration
CANISTER_ID="${CANISTER_ID:-}"
NETWORK="${NETWORK:-ic}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
STATE_FILE="${STATE_FILE:-/tmp/rpi_event_runner_state}"
DRY_RUN="${DRY_RUN:-0}"
ALLOWED_PREFIX="${ALLOWED_PREFIX:-gpioset}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✓ $*"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✗ $*" >&2
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠ $*"
}

# Validate configuration
if [[ -z "$CANISTER_ID" ]]; then
    log_error "CANISTER_ID environment variable is required"
    log_error "Example: export CANISTER_ID=your-canister-id"
    exit 1
fi

# Check for required tools
if ! command -v dfx &> /dev/null; then
    log_error "dfx command not found. Please install dfx (DFINITY SDK)"
    log_error "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq command not found. Please install jq"
    log_error "On Raspberry Pi OS: sudo apt-get install jq"
    exit 1
fi

if [[ "$DRY_RUN" != "1" ]]; then
    if ! command -v gpioset &> /dev/null; then
        log_error "gpioset command not found. Please install libgpiod"
        log_error "On Raspberry Pi OS: sudo apt-get install gpiod"
        exit 1
    fi
fi

# Initialize state file
if [[ ! -f "$STATE_FILE" ]]; then
    echo "0" > "$STATE_FILE"
    log "Initialized state file: $STATE_FILE"
fi

# Read last processed timestamp
get_last_timestamp() {
    if [[ -f "$STATE_FILE" ]]; then
        cat "$STATE_FILE"
    else
        echo "0"
    fi
}

# Save last processed timestamp
save_last_timestamp() {
    local timestamp="$1"
    echo "$timestamp" > "$STATE_FILE"
}

# Fetch recent events from canister
fetch_events() {
    local network_flag=""
    if [[ "$NETWORK" == "local" ]]; then
        network_flag="--network local"
    fi

    dfx canister call $network_flag "$CANISTER_ID" getRecentEvents '()' 2>/dev/null || {
        log_error "Failed to fetch events from canister"
        return 1
    }
}

# Parse events and filter new ones
process_events() {
    local last_timestamp="$1"
    local events_json="$2"
    
    # Parse the Candid output and convert to JSON
    # Events are returned as an array of records
    echo "$events_json" | grep -oP '\(record \{[^}]+\}\)' | while read -r event; do
        # Extract timestamp (nanoseconds since epoch)
        local timestamp=$(echo "$event" | grep -oP 'timestamp = \K[0-9_]+' | tr -d '_')
        
        # Skip if already processed
        if [[ -n "$timestamp" ]] && [[ "$timestamp" -le "$last_timestamp" ]]; then
            continue
        fi
        
        # Extract value field (contains the commands)
        local value=$(echo "$event" | grep -oP 'value = "\K[^"]+' || echo "")
        
        # Extract control name for logging
        local control_name=$(echo "$event" | grep -oP 'controlName = opt "\K[^"]+' || echo "Unknown")
        
        # Extract binary code for logging
        local binary_code=$(echo "$event" | grep -oP 'binaryCode = "\K[^"]+' || echo "")
        
        if [[ -n "$value" ]]; then
            echo "$timestamp|$control_name|$binary_code|$value"
        fi
    done
}

# Execute a single command with safety checks
execute_command() {
    local cmd="$1"
    local control_name="$2"
    local binary_code="$3"
    
    # Trim whitespace
    cmd=$(echo "$cmd" | xargs)
    
    # Skip empty lines
    if [[ -z "$cmd" ]]; then
        return 0
    fi
    
    # Security: Only allow commands starting with the allowed prefix
    if [[ ! "$cmd" =~ ^${ALLOWED_PREFIX} ]]; then
        log_warning "Skipping disallowed command: $cmd"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "1" ]]; then
        log "[DRY RUN] Would execute: $cmd (from: $control_name, code: $binary_code)"
    else
        log "Executing: $cmd (from: $control_name, code: $binary_code)"
        if eval "$cmd" 2>&1; then
            log_success "Command succeeded: $cmd"
        else
            log_error "Command failed: $cmd"
            return 1
        fi
    fi
}

# Main polling loop
main() {
    log "Starting Raspberry Pi Event Runner"
    log "Canister ID: $CANISTER_ID"
    log "Network: $NETWORK"
    log "Poll interval: ${POLL_INTERVAL}s"
    log "State file: $STATE_FILE"
    log "Dry run: $DRY_RUN"
    log "Allowed command prefix: $ALLOWED_PREFIX"
    log "---"
    
    while true; do
        local last_timestamp=$(get_last_timestamp)
        
        # Fetch events
        local events=$(fetch_events)
        if [[ $? -ne 0 ]]; then
            log_error "Failed to fetch events, retrying in ${POLL_INTERVAL}s..."
            sleep "$POLL_INTERVAL"
            continue
        fi
        
        # Process new events
        local new_events=$(process_events "$last_timestamp" "$events")
        
        if [[ -z "$new_events" ]]; then
            log "No new events (last timestamp: $last_timestamp)"
        else
            local max_timestamp="$last_timestamp"
            
            while IFS='|' read -r timestamp control_name binary_code value; do
                log "Processing event from '$control_name' (code: $binary_code, timestamp: $timestamp)"
                
                # Split value by newlines and execute each command
                while IFS= read -r cmd; do
                    execute_command "$cmd" "$control_name" "$binary_code"
                done <<< "$value"
                
                # Update max timestamp
                if [[ "$timestamp" -gt "$max_timestamp" ]]; then
                    max_timestamp="$timestamp"
                fi
            done <<< "$new_events"
            
            # Save the latest timestamp
            save_last_timestamp "$max_timestamp"
            log_success "Processed events up to timestamp: $max_timestamp"
        fi
        
        sleep "$POLL_INTERVAL"
    done
}

# Handle Ctrl+C gracefully
trap 'log "Shutting down..."; exit 0' INT TERM

# Run main loop
main

