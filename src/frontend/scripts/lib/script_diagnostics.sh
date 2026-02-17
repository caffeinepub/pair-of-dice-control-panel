#!/usr/bin/env bash
#
# Script Diagnostics Helper
# Provides standardized error reporting for build and deployment scripts.
#
# Usage:
#   source frontend/scripts/lib/script_diagnostics.sh
#   run_step "Step Name" "command to run"
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Run a named step with comprehensive error diagnostics
# Usage: run_step "Step Name" "command" [args...]
run_step() {
    local step_name="$1"
    shift
    local cmd="$*"
    
    # Create temporary log file
    local log_file
    log_file=$(mktemp)
    
    echo -e "${BLUE}[INFO]${NC} Running: $step_name"
    
    # Run command and capture output
    if eval "$cmd" > "$log_file" 2>&1; then
        # Success - show minimal output
        echo -e "${GREEN}[✓]${NC} $step_name completed successfully"
        rm -f "$log_file"
        return 0
    else
        # Failure - show comprehensive diagnostics
        local exit_code=$?
        echo ""
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  BUILD/DEPLOY STEP FAILED                                  ║${NC}"
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

# Export the function so it can be used by sourcing scripts
export -f run_step
