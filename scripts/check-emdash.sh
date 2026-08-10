#!/usr/bin/env bash
# Fail if U+2014 (em dash) or U+2013 (en dash) appear in user-facing TS/TSX.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

matches="$(
  python3 - <<'PY'
from pathlib import Path

bad = []
for root in (Path("src/app"), Path("src/components")):
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if path.suffix not in {".ts", ".tsx"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if "\u2014" in line or "\u2013" in line:
                bad.append(f"{path}:{i}:{line}")

if bad:
    print("\n".join(bad))
    raise SystemExit(1)
PY
)" || {
  echo "$matches"
  echo "ERROR: em dash (U+2014) or en dash (U+2013) found in user-facing TS/TSX. Use ASCII hyphen-minus (-)." >&2
  exit 1
}

echo "OK: no em/en dashes in src/app or src/components"
