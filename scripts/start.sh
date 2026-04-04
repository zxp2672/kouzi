#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    
    # 检查standalone模式的正确路径
    if [ -f ".next/standalone/workspace/projects/server.js" ]; then
        echo "Using standalone build (workspace/projects)..."
        cd ".next/standalone/workspace/projects"
        PORT=${DEPLOY_RUN_PORT} node server.js
    elif [ -f ".next/standalone/server.js" ]; then
        echo "Using standalone build..."
        cd ".next/standalone"
        PORT=${DEPLOY_RUN_PORT} node server.js
    else
        echo "Falling back to next start..."
        cd "${COZE_WORKSPACE_PATH}"
        PORT=${DEPLOY_RUN_PORT} npx next start -p ${DEPLOY_RUN_PORT}
    fi
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
