#!/bin/bash
# First start of a new system: builds the warehouse from the OLTP data and calculates the customer segments.
# Both steps are skipped when a successful run already exists, so restarting the stack does no extra work.
set -euo pipefail

AUTH_URL="${AUTH_URL:-http://auth-service:9000}"
ETL_URL="${ETL_URL:-http://etl-service:8081}"
SEGMENTATION_URL="${SEGMENTATION_URL:-http://segmentation-service:8084}"
POLL_SECONDS=15
MAX_WAIT_SECONDS=5400

token() {
    curl -fsS -u "etl-scheduler:${AUTH_ETL_CLIENT_SECRET}" -d grant_type=client_credentials -d scope=etl.run \
        "${AUTH_URL}/oauth2/token" | jq -r .access_token
}

api() {
    local method="$1" url="$2" body="${3:-}"
    if [ -n "$body" ]; then
        curl -fsS -X "$method" -H "Authorization: Bearer $(token)" -H 'Content-Type: application/json' -d "$body" "$url"
    else
        curl -fsS -X "$method" -H "Authorization: Bearer $(token)" "$url"
    fi
}

has_success() {
    api GET "$1/runs?size=50" | jq -e '[.content[] | select(.status == "SUCCESS")] | length > 0' > /dev/null
}

# Starts a run and waits until it ends. A request refused because a run is already active is not an error:
# the active run is waited for instead.
run_and_wait() {
    local name="$1" base="$2" body="${3:-}" run_id status waited=0
    run_id=$(api POST "$base/runs" "$body" | jq -r .id) || run_id=$(api GET "$base/runs?size=1" | jq -r '.content[0].id')
    echo "$name run $run_id started."
    while [ "$waited" -lt "$MAX_WAIT_SECONDS" ]; do
        status=$(api GET "$base/runs/$run_id" | jq -r '.run.status')
        case "$status" in
            SUCCESS) echo "$name run $run_id finished."; return 0 ;;
            FAILED) echo "$name run $run_id failed."; return 1 ;;
        esac
        sleep "$POLL_SECONDS"
        waited=$(( waited + POLL_SECONDS ))
    done
    echo "$name run $run_id did not finish in time."
    return 1
}

echo "Waiting for the auth server..."
until token > /dev/null 2>&1; do sleep 5; done

if has_success "${ETL_URL}/api/etl"; then
    echo "The warehouse was loaded before."
else
    run_and_wait "ETL" "${ETL_URL}/api/etl" '{"runType":"FULL"}'
fi

if has_success "${SEGMENTATION_URL}/api/segmentation"; then
    echo "The customer segments were calculated before."
else
    run_and_wait "Segmentation" "${SEGMENTATION_URL}/api/segmentation"
fi
echo "The system is ready."
