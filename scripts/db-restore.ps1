# ============================================================
# AMPARO — Database Restore (PowerShell)
# Restaura o banco a partir de um backup criado pelo db-backup.ps1
#
# Uso:
#   .\scripts\db-restore.ps1 .\backups\amparo_backup_YYYYMMDD_HHMMSS.sql.zip
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Host "ERRO: Arquivo nao encontrado: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "ATENCAO: Esta operacao substituira todos os dados do banco!" -ForegroundColor Yellow
Write-Host "   Arquivo de backup: $BackupFile"
$Confirm = Read-Host "   Confirma restauracao? (s/N)"

if ($Confirm -notmatch "^[sS]$") {
    Write-Host "   Operacao cancelada." -ForegroundColor Gray
    exit 0
}

Write-Host "Restaurando banco de dados..." -ForegroundColor Cyan

# Descompactar se necessário
$SqlFile = $BackupFile
if ($BackupFile -match "\.zip$") {
    $TempDir = [System.IO.Path]::GetTempPath() + "amparo_restore_" + (Get-Date -Format "yyyyMMddHHmmss")
    Expand-Archive -Path $BackupFile -DestinationPath $TempDir
    $SqlFile = (Get-ChildItem $TempDir -Filter "*.sql" | Select-Object -First 1).FullName
}

$DockerAvailable = $null
try {
    docker compose ps postgres 2>&1 | Out-Null
    $DockerAvailable = $true
} catch {
    $DockerAvailable = $false
}

if ($DockerAvailable) {
    $PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "amparo" }
    $PgDb   = if ($env:POSTGRES_DB)   { $env:POSTGRES_DB }   else { "amparo" }
    Get-Content $SqlFile | docker compose exec -T postgres psql -U $PgUser -d $PgDb

} elseif ($env:DATABASE_URL) {
    Get-Content $SqlFile | psql $env:DATABASE_URL

} else {
    Write-Host "ERRO: Defina DATABASE_URL ou execute dentro do ambiente Docker Compose." -ForegroundColor Red
    exit 1
}

# Limpar temporários
if ($BackupFile -match "\.zip$" -and (Test-Path $TempDir)) {
    Remove-Item $TempDir -Recurse -Force
}

Write-Host ""
Write-Host "Restauracao concluida!" -ForegroundColor Green
