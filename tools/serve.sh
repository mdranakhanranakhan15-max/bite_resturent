#!/usr/bin/env bash
# Start Bite on the PHP development server.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-8787}"
HOST="${2:-127.0.0.1}"

if ! command -v php >/dev/null 2>&1; then
  echo "PHP is not installed." >&2
  exit 1
fi

if [ ! -f api/config.php ]; then
  echo "Run this from the Bite project root." >&2
  exit 1
fi

echo "Bite POS → http://${HOST}:${PORT}"
echo "API key → bite-dev-key (change BITE_SYNC_KEY before production)"
echo "Press Ctrl+C to stop."

php -S "${HOST}:${PORT}" -t .
