#!/bin/bash
# ============================================================
# AMPARO — Database Restore Script
# Restores from a backup created by db-backup.sh
#
# Usage:
#   ./scripts/db-restore.sh ./backups/amparo_backup_YYYYMMDD_HHMMSS.sql.gz
# ============================================================

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <arquivo_de_backup>"
    echo "   Exemplo: $0 ./backups/amparo_backup_20250603_120000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo não encontrado: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  ATENÇÃO: Esta operação substituirá todos os dados do banco de dados!"
echo "   Arquivo de backup: ${BACKUP_FILE}"
read -p "   Confirma restauração? (s/N): " CONFIRM

if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "   Operação cancelada."
    exit 0
fi

echo "🔄 Restaurando banco de dados..."

# Detect if compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    DECOMPRESS_CMD="gunzip -c"
else
    DECOMPRESS_CMD="cat"
fi

if command -v docker &> /dev/null && docker compose ps postgres &> /dev/null 2>&1; then
    # Docker Compose mode
    $DECOMPRESS_CMD "$BACKUP_FILE" | docker compose exec -T postgres psql \
        -U "${POSTGRES_USER:-amparo}" \
        -d "${POSTGRES_DB:-amparo}"
elif [ -n "${DATABASE_URL:-}" ]; then
    # Custom DATABASE_URL mode
    $DECOMPRESS_CMD "$BACKUP_FILE" | psql "$DATABASE_URL"
else
    echo "❌ Erro: defina DATABASE_URL ou execute dentro do ambiente Docker Compose."
    exit 1
fi

echo "✅ Restauração concluída!"
