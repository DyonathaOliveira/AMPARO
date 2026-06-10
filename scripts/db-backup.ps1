# ============================================================
# AMPARO — Database Backup (PowerShell)
# Cria um dump comprimido do banco PostgreSQL
#
# Uso:
#   .\scripts\db-backup.ps1                          # Docker Compose
#   $env:DATABASE_URL="<url>"; .\scripts\db-backup.ps1  # URL customizada
# ============================================================

$ErrorActionPreference = "Stop"

$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\amparo_backup_$Timestamp.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "AMPARO — Iniciando backup do banco de dados..." -ForegroundColor Cyan
Write-Host "   Arquivo: $BackupFile"

# Verificar se Docker Compose está disponível e postgres está rodando
$DockerAvailable = $null
try {
    docker compose ps postgres 2>&1 | Out-Null
    $DockerAvailable = $true
} catch {
    $DockerAvailable = $false
}

if ($DockerAvailable) {
    Write-Host "   Modo: Docker Compose" -ForegroundColor Yellow
    $PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "amparo" }
    $PgDb   = if ($env:POSTGRES_DB)   { $env:POSTGRES_DB }   else { "amparo" }

    docker compose exec -T postgres pg_dump `
        -U $PgUser `
        -d $PgDb `
        --clean `
        --if-exists `
        --no-owner `
        --no-acl `
        | Out-File -FilePath $BackupFile -Encoding UTF8

} elseif ($env:DATABASE_URL) {
    Write-Host "   Modo: DATABASE_URL" -ForegroundColor Yellow
    pg_dump $env:DATABASE_URL `
        --clean --if-exists --no-owner --no-acl `
        | Out-File -FilePath $BackupFile -Encoding UTF8

} else {
    Write-Host "ERRO: Defina DATABASE_URL ou execute dentro do ambiente Docker Compose." -ForegroundColor Red
    exit 1
}

# Comprimir com .zip (nativo no Windows, sem dependências externas)
$ZipFile = "$BackupFile.zip"
Compress-Archive -Path $BackupFile -DestinationPath $ZipFile
Remove-Item $BackupFile

$Size = (Get-Item $ZipFile).Length / 1KB
Write-Host ""
Write-Host "Backup concluido!" -ForegroundColor Green
Write-Host "   Arquivo: $ZipFile"
Write-Host "   Tamanho: $([math]::Round($Size, 1)) KB"
Write-Host ""
Write-Host "   Para restaurar:"
Write-Host "   .\scripts\db-restore.ps1 $ZipFile"
