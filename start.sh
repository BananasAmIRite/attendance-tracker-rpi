#!/bin/bash

# navigate to shell directory
cd "$(dirname "$0")"

# make logs directory if no exist
mkdir -p logs

# start both in parallel and log
((cd attendance-tracker-server && npm start) 2>&1 | tee ./logs/log_server_$(date '+%Y-%m-%d-%H-%M').txt) & ((cd attendance-tracker-client && npm start) 2>&1 | tee ./logs/log_client_$(date '+%Y-%m-%d-%H-%M').txt)