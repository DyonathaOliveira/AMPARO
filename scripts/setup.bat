@echo off
REM ============================================================
REM AMPARO — Setup para Windows
REM Execute este arquivo para configurar o projeto no Windows
REM ============================================================

echo.
echo Iniciando configuracao do AMPARO para Windows...
echo.

REM Executar o script PowerShell com permissao de execucao
powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: O setup falhou. Verifique os erros acima.
    pause
    exit /b 1
)

pause
