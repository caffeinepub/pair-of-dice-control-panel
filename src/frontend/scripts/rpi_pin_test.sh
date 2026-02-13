#!/usr/bin/env bash
#
# Raspberry Pi GPIO Pin Verification Script
# Tests GPIO output pins (26, 6, 22, 4) used by the control panel application.
#
# This script helps verify your GPIO wiring before connecting the control panel.
# It does NOT require the Internet Computer canister or dfx to run.
#
# Usage:
#   DRY_RUN=1 bash scripts/rpi_pin_test.sh              # Print commands without executing
#   bash scripts/rpi_pin_test.sh                        # Interactive mode (prompts before each pin)
#   INTERACTIVE=0 bash scripts/rpi_pin_test.sh          # Non-interactive mode (auto-cycle)
#   INTERACTIVE=0 DELAY_SECONDS=2 bash scripts/rpi_pin_test.sh  # Custom delay
#
# Configuration via environment variables:
#   DRY_RUN         - Set to 1 to print commands without executing (default: 0)
#   INTERACTIVE     - Set to 0 for automatic cycling, 1 for step-through (default: 1)
#   DELAY_SECONDS   - Delay between pin toggles in non-interactive mode (default: 1)
#   PULSE_DURATION  - How long to hold each pin high in seconds (default: 0.5)
#

set -euo pipefail

# Configuration
DRY_RUN="${DRY_RUN:-0}"
INTERACTIVE="${INTERACTIVE:-1}"
DELAY_SECONDS="${DELAY_SECONDS:-1}"
PULSE_DURATION="${PULSE_DURATION:-0.5}"

# Pin mapping (matches the control panel application)
# Bit 0 -> GPIO 26
# Bit 1 -> GPIO 6
# Bit 2 -> GPIO 22
# Bit 3 -> GPIO 4
PINS=(26 6 22 4)
PIN_LABELS=("Bit 0 (GPIO 26)" "Bit 1 (GPIO 6)" "Bit 2 (GPIO 22)" "Bit 3 (GPIO 4)")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  Raspberry Pi GPIO Pin Verification Script                ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

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

# Check dependencies
check_dependencies() {
    if [[ "$DRY_RUN" == "1" ]]; then
        log "DRY_RUN mode enabled - skipping dependency checks"
        return 0
    fi
    
    if ! command -v gpioset &> /dev/null; then
        log_error "gpioset command not found!"
        echo ""
        log_instruction "Install libgpiod tools:"
        echo "  ${BOLD}sudo apt-get update${NC}"
        echo "  ${BOLD}sudo apt-get install gpiod${NC}"
        echo ""
        log_instruction "After installation, you may need to add your user to the gpio group:"
        echo "  ${BOLD}sudo usermod -a -G gpio \$USER${NC}"
        echo "  ${BOLD}# Then log out and back in${NC}"
        echo ""
        exit 1
    fi
    
    log_success "gpioset found"
}

# Set a pin to a specific value
set_pin() {
    local pin="$1"
    local value="$2"
    local label="$3"
    
    local cmd="gpioset gpiochip0 ${pin}=${value}"
    
    if [[ "$DRY_RUN" == "1" ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would execute: ${BOLD}$cmd${NC} ($label)"
    else
        if eval "$cmd" 2>&1; then
            return 0
        else
            log_error "Failed to execute: $cmd"
            return 1
        fi
    fi
}

# Test a single pin
test_pin() {
    local pin="$1"
    local label="$2"
    local bit_index="$3"
    
    echo ""
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Testing: $label${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [[ "$INTERACTIVE" == "1" ]]; then
        log_instruction "This will toggle GPIO pin $pin (bit $bit_index in the 4-bit code)"
        log_instruction "Connect an LED or multimeter to GPIO $pin to observe the change"
        echo ""
        read -p "Press ENTER to toggle pin HIGH, or Ctrl+C to exit... " -r
    fi
    
    # Set pin HIGH
    log "Setting GPIO $pin HIGH..."
    if set_pin "$pin" "1" "$label"; then
        if [[ "$DRY_RUN" != "1" ]]; then
            log_success "GPIO $pin is now HIGH"
            log_instruction "Observe: LED should light up / multimeter should read ~3.3V"
        fi
    fi
    
    # Hold for pulse duration
    if [[ "$DRY_RUN" != "1" ]]; then
        sleep "$PULSE_DURATION"
    fi
    
    # Set pin LOW (safety: return to default state)
    log "Setting GPIO $pin LOW (returning to safe state)..."
    if set_pin "$pin" "0" "$label"; then
        if [[ "$DRY_RUN" != "1" ]]; then
            log_success "GPIO $pin is now LOW"
            log_instruction "Observe: LED should turn off / multimeter should read ~0V"
        fi
    fi
    
    if [[ "$INTERACTIVE" == "1" ]]; then
        echo ""
        read -p "Press ENTER to continue to next pin, or Ctrl+C to exit... " -r
    else
        if [[ "$DRY_RUN" != "1" ]]; then
            sleep "$DELAY_SECONDS"
        fi
    fi
}

# Main test sequence
main() {
    print_header
    
    log "Pin mapping used by the control panel application:"
    for i in "${!PINS[@]}"; do
        echo "  Bit $i → GPIO ${PINS[$i]}"
    done
    echo ""
    
    log "Configuration:"
    echo "  DRY_RUN: $DRY_RUN"
    echo "  INTERACTIVE: $INTERACTIVE"
    echo "  DELAY_SECONDS: $DELAY_SECONDS"
    echo "  PULSE_DURATION: $PULSE_DURATION"
    echo ""
    
    # Check dependencies
    check_dependencies
    
    if [[ "$DRY_RUN" == "1" ]]; then
        log_warning "DRY_RUN mode - commands will be printed but not executed"
        echo ""
    fi
    
    if [[ "$INTERACTIVE" == "1" ]]; then
        log "Running in INTERACTIVE mode - you will be prompted before each pin"
    else
        log "Running in NON-INTERACTIVE mode - pins will cycle automatically"
    fi
    
    echo ""
    log_instruction "Safety note: Each pin will be set HIGH briefly, then returned to LOW"
    log_instruction "This is a pre-wiring verification tool - no canister connection required"
    
    if [[ "$INTERACTIVE" == "1" ]]; then
        echo ""
        read -p "Press ENTER to start testing, or Ctrl+C to exit... " -r
    else
        echo ""
        log "Starting automatic pin cycling in 2 seconds..."
        sleep 2
    fi
    
    # Test each pin
    for i in "${!PINS[@]}"; do
        test_pin "${PINS[$i]}" "${PIN_LABELS[$i]}" "$i"
    done
    
    echo ""
    echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${GREEN}║  All pins tested successfully!                            ║${NC}"
    echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_success "Pin verification complete"
    log_instruction "All pins have been returned to LOW (safe state)"
    echo ""
    log "Next steps:"
    echo "  1. Wire your GPIO devices to the tested pins"
    echo "  2. Configure and run the event runner: scripts/rpi_event_runner.sh"
    echo "  3. Use the control panel to send commands"
    echo ""
}

# Handle Ctrl+C gracefully
cleanup() {
    echo ""
    log_warning "Interrupted - ensuring all pins are LOW..."
    
    if [[ "$DRY_RUN" != "1" ]]; then
        for pin in "${PINS[@]}"; do
            gpioset gpiochip0 "${pin}=0" 2>/dev/null || true
        done
    fi
    
    log_success "Cleanup complete"
    exit 0
}

trap cleanup INT TERM

# Run main
main
