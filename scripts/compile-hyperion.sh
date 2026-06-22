#!/usr/bin/env sh
set -eu

HYPC="${HYPC:-hypcjs}"
ROOT="${1:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"

if ! command -v "$HYPC" >/dev/null 2>&1; then
    echo "error: Hyperion compiler not found: $HYPC" >&2
    echo "install hypcjs from theQRL/hypc-js, install native hypc, or set HYPC=/path/to/compiler" >&2
    exit 127
fi

cd "$ROOT"

sources="$(find interfaces token utils -type f -name '*.hyp' | sort)"
if [ -z "$sources" ]; then
    echo "error: no Hyperion sources found" >&2
    exit 1
fi

out_dir="$(mktemp -d "${TMPDIR:-/tmp}/qrl-contracts-hypc.XXXXXX")"
trap 'rm -rf "$out_dir"' EXIT INT TERM

# Repository paths are controlled and do not contain whitespace.
# shellcheck disable=SC2086
"$HYPC" --base-path . --include-path . -o "$out_dir" --bin $sources
