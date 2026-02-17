# Raspberry Pi Bash Event Runner

This document describes how to set up and run the Raspberry Pi Bash event runner that polls the backend canister for GPIO control events and executes them locally on your Raspberry Pi.

## Overview

The `rpi_event_runner.sh` script:
- Polls the backend canister's `getRecentEvents` method at a configurable interval
- Parses returned events and extracts GPIO commands from the `value` field
- Executes commands locally using `gpioset` (from libgpiod)
- Tracks processed events to prevent duplicate execution
- Supports dry-run mode for testing
- Logs all operations with timestamps

## Event Format

Events emitted by the control panel have the following structure:

