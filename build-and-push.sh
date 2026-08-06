#!/bin/bash
# ── build-and-push.sh ─────────────────────────────────────────────────────────
# Builds all three Docker images and pushes to the Snowflake Image Repository.
#
# Prerequisites:
#   1. Docker Desktop running
#   2. Snowflake CLI installed: pip3 install snowflake-cli-labs
#   3. snow connection configured: snow connection add --connection-name spcs ...
#
# Usage:
#   export REPO_URL=<your_image_repo_url>   # from: SHOW IMAGE REPOSITORIES;
#   export GROUP=<your_group_number>        # e.g. 1, 2, 3...
#   bash build-and-push.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

if [ -z "$REPO_URL" ] || [ -z "$GROUP" ]; then
  echo "Error: REPO_URL and GROUP must be set."
  echo "  export REPO_URL=https://github.com/sidbasamibm/teamTree"
  echo "  export GROUP=3"
  exit 1
fi

TAG="latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  NovaCart Dashboard — Build & Push"
echo "  Repo:  $REPO_URL"
echo "  Group: $GROUP"
echo "═══════════════════════════════════════════════════"
echo ""

# Login to Snowflake registry using keypair (bypasses MFA)
echo "→ Logging in to Snowflake registry..."
snow spcs image-registry login --connection spcs
echo ""

build_and_push() {
  local name=$1
  local context=$2
  local full_name="${name}_group${GROUP}"

  echo "─────────────────────────────────────────────────"
  echo "→ Building: $full_name"
  docker build --no-cache --rm --platform linux/amd64 \
    -t "$full_name:$TAG" "$context"

  echo "→ Pushing: $full_name"
  docker tag "$full_name:$TAG" "$REPO_URL/$full_name:$TAG"
  docker push "$REPO_URL/$full_name:$TAG"
  echo "  ✓ $REPO_URL/$full_name:$TAG"
  echo ""
}

build_and_push "backend_service_image"  "$SCRIPT_DIR/backend"
build_and_push "frontend_service_image" "$SCRIPT_DIR/frontend"
build_and_push "router_service_image"   "$SCRIPT_DIR/router"

echo "═══════════════════════════════════════════════════"
echo "  All images pushed. Notify your facilitator"
echo "  so they can create your SPCS services."
echo "═══════════════════════════════════════════════════"
