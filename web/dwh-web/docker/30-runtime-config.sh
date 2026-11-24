#!/bin/sh
# Runs when the web container starts. Writes /usr/share/nginx/html/runtime-config.js from the container
# environment, so service addresses can change with a restart instead of a rebuild.
set -eu

TARGET="/usr/share/nginx/html/runtime-config.js"

# Only plain http(s) addresses are accepted; anything else would end up inside a JavaScript string.
valid() {
  printf '%s' "$1" | grep -Eq '^https?://[A-Za-z0-9._:-]+(/[A-Za-z0-9._~/%-]*)?$'
}

ENTRIES=""
add_entry() {
  key="$1"
  value="$2"
  if [ -z "$value" ]; then
    return 0
  fi
  if valid "$value"; then
    ENTRIES="${ENTRIES:+$ENTRIES, }$key: \"$value\""
  else
    echo "runtime-config: ignoring invalid address for $key" >&2
  fi
}

add_entry gatewayUrl "${GATEWAY_URL:-}"
add_entry authUrl "${AUTH_URL:-}"
add_entry etlUrl "${ETL_URL:-}"
add_entry shopUrl "${SHOP_URL:-}"
add_entry analyticsUrl "${ANALYTICS_URL:-}"
add_entry segmentationUrl "${SEGMENTATION_URL:-}"

printf 'window.__DWH_CONFIG__ = { %s };\n' "$ENTRIES" > "$TARGET"
echo "runtime-config: written to $TARGET"
