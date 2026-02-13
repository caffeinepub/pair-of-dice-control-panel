# Linux Local Test Bundle Guide

This guide explains how to download, extract, and run the GPIO Control Panel application as a standalone Linux test bundle.

## Overview

The Linux test bundle is a self-contained package that includes:
- Pre-built frontend application
- Compiled backend canister
- Launcher script for easy local deployment
- Raspberry Pi GPIO helper scripts
- Complete documentation

This bundle allows you to test the application locally without needing to clone the repository or set up a development environment.

## Prerequisites

Before running the bundle, ensure you have the following installed on your Linux system:

### Required

1. **dfx (DFINITY SDK)**
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```
   Verify installation:
   ```bash
   dfx --version
   ```

2. **Node.js (v18 or later)**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or use nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   ```
   Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Optional (for Raspberry Pi GPIO features)

3. **jq (JSON processor)**
   ```bash
   # Ubuntu/Debian/Raspberry Pi OS
   sudo apt-get update
   sudo apt-get install -y jq
   ```

4. **libgpiod (GPIO control tools)**
   ```bash
   # Raspberry Pi OS / Ubuntu
   sudo apt-get update
   sudo apt-get install -y gpiod
   ```

## Download and Extract

1. **Download the bundle**
   
   Transfer the `control-panel-linux-bundle-*.tar.gz` file to your Linux machine.

2. **Extract the archive**
   ```bash
   tar -xzf control-panel-linux-bundle-*.tar.gz
   cd control-panel-linux-bundle-*
   ```

3. **Verify contents**
   ```bash
   ls -la
   ```
   You should see:
   - `run.sh` - Launcher script
   - `frontend/` - Built frontend application
   - `backend/` - Compiled backend canister
   - `scripts/` - Raspberry Pi helper scripts
   - `docs/` - Documentation
   - `README.md` - Quick start guide

## Running the Application

### Start the Application

From the extracted bundle directory, run:

