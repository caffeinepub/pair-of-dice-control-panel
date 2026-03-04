# Linux Local Test Bundle — Complete Setup Guide

This guide explains how to build the GPIO Control Panel frontend as a static bundle, serve it from a local Apache HTTP server on Linux, and connect it to the ICP backend canister and GPIO hardware.

---

## Overview

The built output is a self-contained set of static files (`dist/`) that can be copied directly into any Apache web root or served with any static HTTP server. All asset paths are relative (`./`), so the bundle works from any directory or virtual host path.

**Stack summary:**

| Component | Technology | Port |
|---|---|---|
| Frontend (static files) | Apache / http-server | 80 or 8080 |
| Backend canister | dfx local replica | 4943 |
| GPIO signal receiver | Custom HTTP server | 3000 |

---

## Prerequisites

| Requirement | Recommended Version | Install Command |
|---|---|---|
| **Node.js** | v18+ | `nvm install 18` or https://nodejs.org/ |
| **npm** or **pnpm** | latest | bundled with Node.js |
| **dfx** (DFINITY SDK) | 0.15+ | `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"` |
| **Apache HTTP Server** | 2.4+ | `sudo apt install apache2` (Debian/Ubuntu) |
| **jq** | 1.6+ | `sudo apt install jq` |
| **gpiod / gpioset** | 1.6+ | `sudo apt install gpiod` (Raspberry Pi only) |

---

## Step 1 — Build the Frontend

Run these commands from the **`frontend/`** directory of this project:

