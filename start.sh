#!/bin/bash

# navigate to shell directory
cd "$(dirname "$0")"

# start both in parallel
(cd attendance-tracker-server && npm start) & (cd attendance-tracker-client && npm start)