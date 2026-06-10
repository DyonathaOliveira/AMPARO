# ============================================================
# AMPARO — Setup Script para Windows (PowerShell)
# Configura o projeto para execucao local
#
# Uso: .\scripts\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "AMPARO Setup"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  AMPARO — Configuracao para Windows" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ── Verificar Node.js ───────────────────────────────────────
Write-Host "[1/4] Verificando Node.js..." -ForegroundColor Yellow
try {
    $NodeVersion = node --version 2>&1
    if ($NodeVersion -match "v(\d+)\.") {
        $Major = [int]$Matches[1]
        if ($Major -lt 20) {
            Write-Host "     AVISO: Node.js $NodeVersion detectado. Recomendado: v24+" -ForegroundColor Yellow
        } else {
            Write-Host "     OK: Node.js $NodeVersion" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "     ERRO: Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "     Instale em: https://nodejs.org (versao 24 LTS recomendada)" -ForegroundColor Red
    exit 1
}

# ── Verificar pnpm ──────────────────────────────────────────
Write-Host "[2/4] Verificando pnpm..." -ForegroundColor Yellow
try {
    $PnpmVersion = pnpm --version 2>&1
    Write-Host "     OK: pnpm $PnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "     pnpm nao encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm@10
    Write-Host "     OK: pnpm instalado" -ForegroundColor Green
}

# ── Instalar dependencias ───────────────────────────────────
Write-Host "[3/4] Instalando dependencias (pode demorar 2-3 min na primeira vez)..." -ForegroundColor Yellow
pnpm install
Write-Host "     OK: Dependencias instaladas" -ForegroundColor Green

# ── Criar .env ─────────────────────────────────────────────
Write-Host "[4/4] Configurando variaveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "     OK: Arquivo .env criado a partir de .env.example" -ForegroundColor Green
    Write-Host "     IMPORTANTE: Edite o .env com suas configuracoes de banco de dados!" -ForegroundColor Yellow
} else {
    Write-Host "     OK: .env ja existe (mantido sem alteracoes)" -ForegroundColor Green
}

# ── Resumo ──────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Setup concluido!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host ""
Write-Host "  OPCAO 1 — Docker (recomendado, sem instalar PostgreSQL):" -ForegroundColor Yellow
Write-Host "    docker compose up -d" -ForegroundColor White
Write-Host "    Acesse: http://localhost" -ForegroundColor Gray
Write-Host ""
Write-Host "  OPCAO 2 — Manual (PostgreSQL ja instalado):" -ForegroundColor Yellow
Write-Host "    1. Configure DATABASE_URL no arquivo .env" -ForegroundColor White
Write-Host "    2. Use o VS Code: Ctrl+Shift+P -> Tasks: Run Task -> Iniciar AMPARO" -ForegroundColor White
Write-Host ""
