#!/bin/bash
# ============================================================
# AMPARO — Database Backup Script
# Creates a timestamped SQL dump of the production database
#
# Usage:
#   ./scripts/db-backup.sh                        # Docker environment
#   DATABASE_URL=<url> ./scripts/db-backup.sh     # Custom database
# ============================================================

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/amparo_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "🔄 AMPARO — Iniciando backup do banco de dados..."
echo "   Arquivo: ${BACKUP_FILE}"

# Detect environment: Docker Compose or custom DATABASE_URL
if command -v docker &> /dev/null && docker compose ps postgres &> /dev/null 2>&1; then
    # Docker Compose mode
    echo "   Modo: Docker Compose"
    docker compose exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-amparo}" \
        -d "${POSTGRES_DB:-amparo}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        > "$BACKUP_FILE"
elif [ -n "${DATABASE_URL:-}" ]; then
    # Custom DATABASE_URL mode
    echo "   Modo: DATABASE_URL"
    pg_dump "$DATABASE_URL" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        > "$BACKUP_FILE"
else
    echo "❌ Erro: defina DATABASE_URL ou execute dentro do ambiente Docker Compose."
    exit 1
fi

# Compress the backup
gzip "$BACKUP_FILE"
COMPRESSED="${BACKUP_FILE}.gz"

SIZE=$(du -sh "$COMPRESSED" | cut -f1)
echo "✅ Backup concluído!"
echo "   Arquivo: ${COMPRESSED}"
echo "   Tamanho: ${SIZE}"
echo ""
echo "   Para restaurar:"
echo "   ./scripts/db-restore.sh ${COMPRESSED}"
