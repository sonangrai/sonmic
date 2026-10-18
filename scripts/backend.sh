#!/usr/bin/env bash
# Runs the backend on this Mac and opens a temporary public HTTPS address for it
# (a Cloudflare quick tunnel), so the Vercel-hosted app can reach it.
# The address changes on every run; it's printed and copied to the clipboard.
set -euo pipefail

cd "$(dirname "$0")/../backend"
PORT="${PORT:-8000}"
LOG="$(mktemp -t sonmic-tunnel)"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use (is pnpm dev running?). Stop it, or run with PORT=8001 pnpm backend." >&2
  exit 1
fi

ENV_ARGS=()
[[ -f .env ]] && ENV_ARGS=(--env-file .env)

# Bound to localhost: only the tunnel (and this Mac) can reach it directly.
.venv/bin/uvicorn main:app --host 127.0.0.1 --port "$PORT" ${ENV_ARGS[@]+"${ENV_ARGS[@]}"} &
API_PID=$!
TUNNEL_PID=""

cleanup() {
  kill "$API_PID" ${TUNNEL_PID:+"$TUNNEL_PID"} 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT INT TERM

# Only open the tunnel once the backend actually answers.
for _ in {1..30}; do
  curl -sf "http://127.0.0.1:$PORT/health" >/dev/null && break
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "The backend failed to start (see the error above)." >&2
    exit 1
  fi
  sleep 1
done

cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$LOG" 2>&1 &
TUNNEL_PID=$!

URL=""
for _ in {1..60}; do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [[ -n "$URL" ]] && break
  sleep 1
done

if [[ -z "$URL" ]]; then
  echo "The tunnel didn't start. cloudflared said:" >&2
  cat "$LOG" >&2
  exit 1
fi

printf '%s' "$URL" | pbcopy
cat <<MSG

  Backend is live at:  $URL   (copied to clipboard)

  In sonmic: Add audio → Backend server → paste → Save.
  Press Ctrl+C to stop.

MSG

wait "$API_PID"
