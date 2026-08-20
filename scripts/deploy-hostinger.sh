#!/usr/bin/env bash
set -Eeuo pipefail

# NEXO versioned deployment script.
# This script is intended to run on the target Hostinger server over SSH.
# It creates a versioned release, builds it, switches the `current` symlink,
# runs a health check, and rolls back automatically if the check fails.

APP_ROOT="${NEXO_APP_ROOT:-$HOME/apps/nexo}"
REPO_URL="${NEXO_REPO_URL:-https://github.com/ernest196391/ernesto-rondon-nexo.git}"
RELEASE_REF="${1:-main}"
KEEP_RELEASES="${NEXO_KEEP_RELEASES:-5}"
HEALTH_URL="${NEXO_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
START_COMMAND="${NEXO_START_COMMAND:-npm run start -- -p 3000}"

RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_LINK="$APP_ROOT/current"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="$RELEASES_DIR/$STAMP"
PREVIOUS_TARGET=""

log() { printf '[nexo-deploy] %s\n' "$*"; }
fail() { printf '[nexo-deploy] ERROR: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "git is required"
command -v node >/dev/null 2>&1 || fail "node is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v curl >/dev/null 2>&1 || fail "curl is required"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node 20+ required; found $(node -v)"

mkdir -p "$RELEASES_DIR" "$SHARED_DIR"

if [ -L "$CURRENT_LINK" ]; then
  PREVIOUS_TARGET="$(readlink -f "$CURRENT_LINK" || true)"
fi

cleanup_failed_release() {
  if [ -d "$RELEASE_DIR" ]; then rm -rf "$RELEASE_DIR"; fi
}
trap cleanup_failed_release ERR

log "Cloning $RELEASE_REF into $RELEASE_DIR"
git clone --depth 1 --branch "$RELEASE_REF" "$REPO_URL" "$RELEASE_DIR"
cd "$RELEASE_DIR"

log "Installing dependencies"
npm install --no-audit --no-fund

log "Building production bundle"
npm run build

# Optional shared environment file maintained only on the server.
if [ -f "$SHARED_DIR/.env.production" ]; then
  ln -sfn "$SHARED_DIR/.env.production" "$RELEASE_DIR/.env.production"
fi

log "Switching current release"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"

restart_app() {
  if command -v pm2 >/dev/null 2>&1; then
    cd "$CURRENT_LINK"
    if pm2 describe nexo >/dev/null 2>&1; then
      pm2 restart nexo --update-env
    else
      pm2 start bash --name nexo -- -lc "$START_COMMAND"
    fi
    pm2 save >/dev/null 2>&1 || true
    return
  fi

  if [ -n "${NEXO_RESTART_COMMAND:-}" ]; then
    bash -lc "$NEXO_RESTART_COMMAND"
    return
  fi

  fail "No supported restart mechanism found. Install/configure pm2 or set NEXO_RESTART_COMMAND."
}

rollback() {
  if [ -n "$PREVIOUS_TARGET" ] && [ -d "$PREVIOUS_TARGET" ]; then
    log "Rolling back to $PREVIOUS_TARGET"
    ln -sfn "$PREVIOUS_TARGET" "$CURRENT_LINK.tmp"
    mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"
    restart_app || true
  fi
}

log "Restarting application"
if ! restart_app; then
  rollback
  fail "Application restart failed"
fi

log "Running health check: $HEALTH_URL"
HEALTH_OK=0
for attempt in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
    HEALTH_OK=1
    break
  fi
  sleep 5
done

if [ "$HEALTH_OK" -ne 1 ]; then
  rollback
  fail "Health check failed; previous release restored when available"
fi

log "Health check passed"

# Keep only the newest release directories.
mapfile -t old_releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | awk -v keep="$KEEP_RELEASES" 'NR>keep {$1=""; sub(/^ /,""); print}')
for old in "${old_releases[@]:-}"; do
  [ -n "$old" ] && rm -rf "$old"
done

log "Deployment complete: $(readlink -f "$CURRENT_LINK")"
