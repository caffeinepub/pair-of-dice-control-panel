# Raspberry Pi GPIO Event Runner

This document describes how to set up and use the Raspberry Pi GPIO event runner to execute GPIO commands based on events from the Control Panel backend.

## Overview

The `rpi_event_runner.sh` script polls the backend canister for recent GPIO events and executes the corresponding GPIO commands locally on a Raspberry Pi. This enables physical hardware control through the web-based control panel interface.

## Prerequisites

### Required Software

Install the following packages on your Raspberry Pi:

