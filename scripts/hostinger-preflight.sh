#!/usr/bin/env bash
set -u

printf 'NEXO_HOSTINGER_PREFLIGHT\n'
printf 'timestamp=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
printf 'user=%s\n' "$(id -un 2>/dev/null || whoami 2>/dev/null || echo unknown)"
printf 'pwd=%s\n' "$(pwd)"
printf 'shell=%s\n' "${SHELL:-unknown}"
printf 'home=%s\n' "${HOME:-unknown}"

probe() {
  local name="$1"
  shift
  if command -v "$name" >/dev/null 2>&1; then
    printf '%s_path=%s\n' "$name" "$(command -v "$name")"
    printf '%s_version=' "$name"
    "$@" 2>&1 | head -n 1 || true
  else
    printf '%s_path=missing\n' "$name"
  fi
}

probe node node --version
probe npm npm --version
probe git git --version
probe curl curl --version
probe pm2 pm2 --version
probe systemctl systemctl --version

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "${NODE_MAJOR:-0}" -ge 20 ] 2>/dev/null; then
    printf 'node20_plus=yes\n'
  else
    printf 'node20_plus=no\n'
  fi
fi

TEST_DIR="${HOME:-.}/.nexo-preflight-$$"
if mkdir "$TEST_DIR" 2>/dev/null; then
  printf 'home_write=yes\n'
  if ln -s "$TEST_DIR" "${TEST_DIR}.link" 2>/dev/null; then
    printf 'symlink=yes\n'
    rm -f "${TEST_DIR}.link" 2>/dev/null || true
  else
    printf 'symlink=no\n'
  fi
  rmdir "$TEST_DIR" 2>/dev/null || true
else
  printf 'home_write=no\n'
  printf 'symlink=unknown\n'
fi

printf 'ports_listening_hint=' 
if command -v ss >/dev/null 2>&1; then
  ss -ltn 2>/dev/null | awk 'NR>1 {print $4}' | tail -n 8 | tr '\n' ',' || true
elif command -v netstat >/dev/null 2>&1; then
  netstat -ltn 2>/dev/null | awk 'NR>2 {print $4}' | tail -n 8 | tr '\n' ',' || true
else
  printf 'unavailable'
fi
printf '\n'

printf 'result=inspection_only_no_changes_made\n'
