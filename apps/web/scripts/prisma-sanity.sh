#!/usr/bin/env bash
set -euo pipefail

if [[ -f ".env" ]]; then
  # Prisma validate requires DATABASE_URL in this project.
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

echo "[prisma-sanity] Running prisma validate..."
bunx prisma validate

echo "[prisma-sanity] Running prisma generate..."
bunx prisma generate

echo "[prisma-sanity] OK"
