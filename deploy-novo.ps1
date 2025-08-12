#!/usr/bin/env pwsh
# ========================================
# SCRIPT DE DEPLOY PARA CLIENTE: novo
# ========================================

Write-Host "Iniciando deploy para cliente: Restaurante Novo" -ForegroundColor Green

# Verificar se os arquivos existem
if (-not (Test-Path "env.prod.novo")) {
    Write-Host "ERRO: Arquivo env.prod.novo nao encontrado!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "docker-compose.novo.yml")) {
    Write-Host "ERRO: Arquivo docker-compose.novo.yml nao encontrado!" -ForegroundColor Red
    exit 1
}

# Parar servicos existentes (se houver)
Write-Host "Parando servicos existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.novo.yml down 2>$null

# Build das imagens
Write-Host "Fazendo build das imagens..." -ForegroundColor Blue
docker-compose -f docker-compose.novo.yml build

# Subir servicos
Write-Host "Subindo servicos..." -ForegroundColor Green
docker-compose -f docker-compose.novo.yml up -d

# Aguardar servicos estarem prontos
Write-Host "Aguardando servicos estarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "Verificando status dos servicos..." -ForegroundColor Blue
docker-compose -f docker-compose.novo.yml ps

Write-Host "Deploy concluido para cliente: Restaurante Novo" -ForegroundColor Green
Write-Host "Frontend: http://localhost:${FRONTEND_PORT:-80}" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:${BACKEND_PORT:-8000}" -ForegroundColor Cyan
Write-Host "Banco: localhost:${POSTGRES_PORT:-5432}" -ForegroundColor Cyan
Write-Host "Redis: localhost:${REDIS_PORT:-6379}" -ForegroundColor Cyan
