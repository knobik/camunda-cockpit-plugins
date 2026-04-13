#!/usr/bin/env bash
set -euo pipefail

IMAGE="camunda/camunda-bpm-platform:7.18.0"
CONTAINER_NAME="camunda-cockpit-setup-tmp"
SRC_PATH="/camunda/webapps/camunda/app/cockpit/scripts/camunda-cockpit-ui.js"

echo "Extracting camunda-cockpit-ui.js from ${IMAGE}..."
docker create --name "$CONTAINER_NAME" "$IMAGE" > /dev/null
docker cp "${CONTAINER_NAME}:${SRC_PATH}" ./camunda-cockpit-ui.js
docker rm "$CONTAINER_NAME" > /dev/null
echo "Done. camunda-cockpit-ui.js copied to project root."
