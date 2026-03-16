#!/bin/bash
# Pre-tool-use hook: inject pending annotations into agent context when
# editing component files. Only fires if the playground is running.
# Outputs to stdout (exit 0) — informational, never blocks.
# Phase 1 scope: only auto-resolves canonical component IDs that match the
# lowercased component directory/file name. Custom appRegistry slugs are out
# of scope for automatic injection in this phase.

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Nothing to do without a file path
[ -z "$FILE" ] && exit 0

# Match component source files and extract the component ID.
COMPONENT_ID=""

if echo "$FILE" | grep -qE 'packages/[^/]+/components/core/[^/]+/'; then
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*packages/[^/]+/components/core/([^/]+)/.*|\1|' | tr '[:upper:]' '[:lower:]')
elif echo "$FILE" | grep -qE 'apps/[^/]+/(src/)?components/[^/]+'; then
  COMPONENT_ID=$(echo "$FILE" | sed -E 's|.*components/([^/]+)(\.[^/]+)?(/.*)?$|\1|' | sed 's/\..*//' | tr '[:upper:]' '[:lower:]')
fi

[ -z "$COMPONENT_ID" ] && exit 0

# Check if the playground is actually running (1s timeout, fail silently)
RESPONSE=$(curl -sf --max-time 1 "http://localhost:3004/playground/api/agent/annotation?componentId=$COMPONENT_ID&status=pending" 2>/dev/null)

[ -z "$RESPONSE" ] && exit 0

# Parse annotation count
COUNT=$(echo "$RESPONSE" | jq '.annotations | length' 2>/dev/null)

[ "$COUNT" = "0" ] || [ -z "$COUNT" ] && exit 0

# Format and output pending annotations to stdout
echo ""
echo "[playground] $COUNT pending annotation(s) on \"$COMPONENT_ID\":"
echo "$RESPONSE" | jq -r '.annotations[] | "  [\(.intent)/\(.severity)] \(.message)"' 2>/dev/null
echo ""

exit 0
