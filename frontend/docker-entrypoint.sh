#!/bin/sh
set -e

# Print port information
echo ""
echo "=========================================="
echo "  🌐 Frontend is running on http://localhost:80"
echo "=========================================="
echo ""

# Execute nginx with the provided arguments
exec nginx "$@"

