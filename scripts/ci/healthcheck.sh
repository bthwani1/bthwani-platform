#!/bin/sh
# Health check script for Docker containers
# Checks both /health/live and /health/ready endpoints

set -e

# Default to localhost:3000 if not set
HOST="${HOST:-localhost}"
PORT="${HTTP_PORT:-3000}"

# Check liveness
curl -f "http://${HOST}:${PORT}/health/live" || exit 1

# Check readiness
curl -f "http://${HOST}:${PORT}/health/ready" || exit 1

echo "Health check PASS"
exit 0

