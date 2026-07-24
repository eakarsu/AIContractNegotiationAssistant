#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$ROOT_DIR/.env" ]] || { echo "Missing .env. Copy .env.example and configure it first." >&2; exit 1; }
set -a; . "$ROOT_DIR/.env"; set +a
BACKEND_PORT="${BACKEND_PORT:-${PORT:-5001}}"; FRONTEND_PORT="${FRONTEND_PORT:-5173}"; PORT="$BACKEND_PORT"; CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:$FRONTEND_PORT,http://localhost:$FRONTEND_PORT}"; export BACKEND_PORT PORT FRONTEND_PORT CORS_ORIGINS
[[ -d "$ROOT_DIR/backend/node_modules" && -d "$ROOT_DIR/frontend/node_modules" ]] || { echo "Dependencies missing; run npm ci separately in backend and frontend." >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $port is occupied; refusing to kill another process." >&2; exit 1; }; done
if [[ "${MIGRATE_ON_START:-false}" == true ]]; then (cd "$ROOT_DIR/backend" && npm run db:migrate && npm run create-user); fi
(cd "$ROOT_DIR/backend" && npm start) & backend_pid=$!
(cd "$ROOT_DIR/frontend" && npm run dev -- --port "$FRONTEND_PORT") & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null||true; wait "$backend_pid" "$frontend_pid" 2>/dev/null||true; }
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
