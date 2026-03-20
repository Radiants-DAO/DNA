#!/bin/bash
# Pre-tool-use hook: auto-signal playground when agents edit component files.
# Only fires if the playground dev server is running on port 3004.
# work-start is idempotent (Set-based), so repeated calls are harmless.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Nothing to do without a file path
[ -z "$FILE" ] && exit 0

# Match component source files and extract the component ID.
# Patterns:
#   packages/radiants/components/core/Button/Button.tsx  → button
#   packages/radiants/components/core/Card/Card.tsx      → card
#   apps/rad-os/components/WindowChrome.tsx              → windowchrome
#   apps/radiator/src/components/BurnDialog.tsx          → burndialog
COMPONENT_ID=""

if echo "$FILE" | grep -qE 'packages/[^/]+/components/core/[^/]+/'; then
  # packages/<pkg>/components/core/<ComponentDir>/...
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*packages/[^/]+/components/core/([^/]+)/.*|\1|' | tr '[:upper:]' '[:lower:]')
elif echo "$FILE" | grep -qE 'apps/[^/]+/(src/)?components/[^/]+'; then
  # apps/<app>/(src/)components/<File>.tsx or <Dir>/...
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*components/([^/]+)(\.[^/]+)?(/.*)?$|\1|' | sed 's/\..*//' | tr '[:upper:]' '[:lower:]')
fi

[ -z "$COMPONENT_ID" ] && exit 0

# Check if the playground is actually running (1s timeout, fail silently)
if ! curl -sf --max-time 1 "http://localhost:3004/playground/api/agent/signal?format=json" > /dev/null 2>&1; then
  exit 0
fi

# Fire work-start (idempotent — signal store uses a Set)
curl -sf --max-time 2 -X POST "http://localhost:3004/playground/api/agent/signal" \
  -H 'Content-Type: application/json' \
  -d "{\"action\":\"work-start\",\"componentId\":\"$COMPONENT_ID\"}" \
  > /dev/null 2>&1

exit 0
