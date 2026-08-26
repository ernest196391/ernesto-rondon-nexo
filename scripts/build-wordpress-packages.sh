#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_dir="$repo_root/releases"
mkdir -p "$release_dir"
for plugin in nexo-product-studio nexo-marketplace; do
  archive="$release_dir/$plugin.zip"
  rm -f "$archive"
  (cd "$repo_root/wordpress" && zip -qr "$archive" "$plugin" -x '*.DS_Store')
done
(cd "$release_dir" && sha256sum nexo-product-studio.zip nexo-marketplace.zip > SHA256SUMS)
