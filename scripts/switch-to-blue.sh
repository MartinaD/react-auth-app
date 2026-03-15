#!/bin/bash
# Switch traffic from Green back to Blue (rollback)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ACTIVE_CONF="$REPO_ROOT/nginx/active.conf"

cat > "$ACTIVE_CONF" << 'BLUE'
# Active environment: Blue (default)
# To switch to Green: run ./scripts/switch-to-green.sh

upstream frontend_active {
    server blue-frontend:80;
}

upstream backend_active {
    server blue-backend:3001;
}
BLUE

docker exec app-nginx nginx -s reload 2>/dev/null || echo "Run: docker compose -f docker-compose.blue-green.yml up -d first (container app-nginx must be running)."
echo "Traffic switched to Blue (rollback)."
