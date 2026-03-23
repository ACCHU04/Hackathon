#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# run_local.sh  —  Start backend + frontend locally (no Docker)
# ──────────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Auto-create .env if missing
if [ ! -f "$ROOT/.env" ]; then
  echo "📋  No .env found — copying .env.example → .env"
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "    Edit .env to add API keys (optional — runs in mock mode without them)"
fi

echo "🔧  Starting FastAPI backend on http://localhost:8000 …"
cd "$ROOT"
PYTHONPATH=backend python -m uvicorn backend.app.main:app \
  --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 2

echo "🎨  Starting Next.js frontend on http://localhost:3000 …"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅  Running:"
echo "    Backend  → http://localhost:8000"
echo "    Frontend → http://localhost:3000"
echo "    API docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop."

trap "echo ''; echo 'Stopping…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
