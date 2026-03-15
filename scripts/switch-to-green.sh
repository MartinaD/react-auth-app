#!/bin/bash
# Switch traffic from Blue to Green (new version becomes active)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" # absolute path to the script
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)" # absolute path to the root of the repository
ACTIVE_CONF="$REPO_ROOT/nginx/active.conf" # path to the active.conf file

cat > "$ACTIVE_CONF" << 'GREEN' # write the active.conf file
# Active environment: Green
# To switch back to Blue: run ./scripts/switch-to-blue.sh

upstream frontend_active {
    server green-frontend:80;
}

upstream backend_active {
    server green-backend:3001;
}
GREEN

docker exec app-nginx nginx -s reload 2>/dev/null || echo "Run: docker-compose -f docker-compose.blue-green.yml up -d first (container app-nginx must be running)." # reload the nginx configuration
echo "Traffic switched to Green."
