#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/.review"
OUTPUT_FILE="${OUTPUT_DIR}/packet.md"

mkdir -p "${OUTPUT_DIR}"

echo "[review-packet] Building report at ${OUTPUT_FILE}"

{
  echo "# Review Packet"
  echo
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
  echo "## Git Status"
  echo
  echo '```'
  git -C "${ROOT_DIR}" status --short
  echo '```'
  echo
  echo "## Changed Files"
  echo
  echo '```'
  git -C "${ROOT_DIR}" diff --name-only
  echo '```'
  echo
  echo "## Diff Stat"
  echo
  echo '```'
  git -C "${ROOT_DIR}" diff --stat
  echo '```'
  echo
} > "${OUTPUT_FILE}"

{
  echo "[review-packet] Running lint..."
  if bun run lint >> "${OUTPUT_FILE}" 2>&1; then
    echo "[review-packet] lint: OK"
  else
    echo "[review-packet] lint: FAILED (see ${OUTPUT_FILE})"
  fi

  echo "[review-packet] Running typecheck (tsc --noEmit)..."
  if bunx tsc --noEmit >> "${OUTPUT_FILE}" 2>&1; then
    echo "[review-packet] typecheck: OK"
  else
    echo "[review-packet] typecheck: FAILED (see ${OUTPUT_FILE})"
  fi
} | tee -a "${OUTPUT_FILE}"

if [[ "${1:-}" == "--with-prisma" ]]; then
  echo "[review-packet] Running prisma sanity..." | tee -a "${OUTPUT_FILE}"
  if "${ROOT_DIR}/scripts/prisma-sanity.sh" >> "${OUTPUT_FILE}" 2>&1; then
    echo "[review-packet] prisma-sanity: OK" | tee -a "${OUTPUT_FILE}"
  else
    echo "[review-packet] prisma-sanity: FAILED (see ${OUTPUT_FILE})" | tee -a "${OUTPUT_FILE}"
  fi
fi

echo "[review-packet] Done: ${OUTPUT_FILE}"
