# GPIO Control Panel — Linux Installation Guide

This guide walks you through installing and running the GPIO Control Panel on a Linux machine (desktop, server, or Raspberry Pi).

---

## Prerequisites

| Requirement | Version | Install |
|---|---|---|
| **dfx** (DFINITY SDK) | 0.15+ | `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"` |
| **Node.js** | v18+ | https://nodejs.org/ or `nvm install 18` |
| **npm** or **pnpm** | latest | bundled with Node.js |
| **Apache HTTP Server** | 2.4+ | `sudo apt install apache2` (Debian/Ubuntu) or `sudo dnf install httpd` (RHEL/Fedora) |
| **jq** | 1.6+ | `sudo apt install jq` (for Raspberry Pi GPIO scripts) |
| **gpiod / gpioset** | 1.6+ | `sudo apt install gpiod` (Raspberry Pi only) |

> **Note:** Apache is only needed if you want to serve the frontend over HTTP. You can also use `npx http-server` or `npx serve` as a lightweight alternative.

---

## Quick Start (Automated)

If you received a pre-built `.tar.gz` bundle:

