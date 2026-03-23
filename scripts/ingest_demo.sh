#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# ingest_demo.sh — POST each demo JSON to the /extract endpoint and
#                  print the returned claims.
# Usage: ./scripts/ingest_demo.sh [backend_url]
# ──────────────────────────────────────────────────────────────────
set -e

BASE_URL="${1:-http://localhost:8000}"
EXAMPLES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../examples" && pwd)"

for DEMO_FILE in "$EXAMPLES_DIR"/demo*.json; do
  DEMO_ID=$(basename "$DEMO_FILE" .json)
  INPUT_TEXT=$(python3 -c "import json,sys; d=json.load(open('$DEMO_FILE')); print(d['input_text'])")

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 Running: $DEMO_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  RESPONSE=$(curl -s -X POST "$BASE_URL/extract" \
    -H "Content-Type: application/json" \
    -d "{\"text\": $(python3 -c "import json,sys; print(json.dumps('$INPUT_TEXT')")}")

  echo "$RESPONSE" | python3 -m json.tool
  echo ""
done

echo "✅ All demo ingestions complete."
