#!/bin/sh
set -e

# Fix permissions for /app/data directory
# This is needed because Docker volumes are mounted with root ownership
# but the app runs as nodejs user
if [ -d "/app/data" ]; then
    chown -R nodejs:nodejs /app/data
    chmod -R 755 /app/data
fi

# Switch to nodejs user and run the application
exec su-exec nodejs "$@"

