#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$ClientName,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$false)]
    [string]$RestaurantName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RestaurantAddress = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RestaurantPhone = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RestaurantEmail = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RestaurantCNPJ = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfirmation
)

# Funcao para gerar senha forte
function Generate-StrongPassword {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = ""
    for ($i = 0; $i -lt 16; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    return $password
}

# Funcao para gerar chave secreta
function Generate-SecretKey {
    $bytes = New-Object Byte[] 32
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Funcao para criar arquivo de ambiente
function Create-EnvironmentFile {
    $envFile = "env.prod.$ClientId"
    $templateFile = "env.prod"
    
    if (-not (Test-Path $templateFile)) {
        Write-Host "ERRO: Arquivo env.prod nao encontrado!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Criando arquivo de ambiente: $envFile" -ForegroundColor Blue
    
    # Gerar senhas e chaves
    $dbPassword = Generate-StrongPassword
    $redisPassword = Generate-StrongPassword
    $secretKey = Generate-SecretKey
    
    # Ler template e substituir valores
    $content = Get-Content $templateFile -Raw
    
    # Substituicoes basicas
    $content = $content -replace 'CLIENT_NAME=.*', "CLIENT_NAME=$ClientName"
    $content = $content -replace 'CLIENT_ID=.*', "CLIENT_ID=$ClientId"
    $content = $content -replace 'POSTGRES_DB=.*', "POSTGRES_DB=quiosque_$ClientId"
    $content = $content -replace 'POSTGRES_USER=.*', "POSTGRES_USER=quiosque_${ClientId}"
    $content = $content -replace 'POSTGRES_PASSWORD=.*', "POSTGRES_PASSWORD=$dbPassword"
    $content = $content -replace 'SECRET_KEY=.*', "SECRET_KEY=$secretKey"
    $content = $content -replace 'REDIS_PASSWORD=.*', "REDIS_PASSWORD=$redisPassword"
    
    # Adicionar DATABASE_URL
    $content = $content -replace 'DATABASE_URL=.*', "DATABASE_URL=postgresql://quiosque_${ClientId}:$dbPassword@postgres_${ClientId}:5432/quiosque_${ClientId}"
    
    # Substituicoes condicionais
    if ($RestaurantName) {
        $content = $content -replace 'RESTAURANT_NAME=.*', "RESTAURANT_NAME=$RestaurantName"
    }
    
    if ($RestaurantAddress) {
        $content = $content -replace 'RESTAURANT_ADDRESS=.*', "RESTAURANT_ADDRESS=$RestaurantAddress"
    }
    
    if ($RestaurantPhone) {
        $content = $content -replace 'RESTAURANT_PHONE=.*', "RESTAURANT_PHONE=$RestaurantPhone"
    }
    
    if ($RestaurantEmail) {
        $content = $content -replace 'RESTAURANT_EMAIL=.*', "RESTAURANT_EMAIL=$RestaurantEmail"
    }
    
    if ($RestaurantCNPJ) {
        $content = $content -replace 'RESTAURANT_CNPJ=.*', "RESTAURANT_CNPJ=$RestaurantCNPJ"
    }
    
    if ($Domain) {
        $content = $content -replace 'CORS_ORIGINS=.*', "CORS_ORIGINS=https://$Domain,https://www.$Domain"
    }
    
    # Salvar arquivo
    $content | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "OK: Arquivo de ambiente criado: $envFile" -ForegroundColor Green
    
    return @{
        EnvFile = $envFile
        DbPassword = $dbPassword
        RedisPassword = $redisPassword
        SecretKey = $secretKey
    }
}

# Funcao para criar docker-compose.yml
function Create-DockerCompose {
    $composeFile = "docker-compose.$ClientId.yml"
    
    Write-Host "Criando docker-compose: $composeFile" -ForegroundColor Blue
    
    # Usar substituicao de string para evitar problemas com here-strings
    $content = @"
version: '3.8'

services:
  # PostgreSQL do cliente
  postgres_${ClientId}:
    image: postgres:15
    container_name: quiosque_postgres_${ClientId}
    environment:
      POSTGRES_DB: quiosque_${ClientId}
      POSTGRES_USER: quiosque_${ClientId}
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
    ports:
      - "`${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data_${ClientId}:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - quiosque_network_${ClientId}

  # Redis do cliente
  redis_${ClientId}:
    image: redis:7-alpine
    container_name: quiosque_redis_${ClientId}
    ports:
      - "`${REDIS_PORT:-6379}:6379"
    restart: unless-stopped
    networks:
      - quiosque_network_${ClientId}

  # Backend do cliente
  backend_${ClientId}:
    build: ./backend
    container_name: quiosque_backend_${ClientId}
    env_file: env.prod.${ClientId}
    ports:
      - "`${BACKEND_PORT:-8000}:8000"
    depends_on:
      - postgres_${ClientId}
      - redis_${ClientId}
    restart: unless-stopped
    networks:
      - quiosque_network_${ClientId}
    volumes:
      - ./logs:/app/logs

  # Frontend do cliente
  frontend_${ClientId}:
    build: ./frontend
    container_name: quiosque_frontend_${ClientId}
    env_file: env.prod.${ClientId}
    ports:
      - "`${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend_${ClientId}
    restart: unless-stopped
    networks:
      - quiosque_network_${ClientId}

networks:
  quiosque_network_${ClientId}:
    driver: bridge

volumes:
  postgres_data_${ClientId}:
"@
    
    $content | Out-File -FilePath $composeFile -Encoding UTF8
    Write-Host "OK: Docker-compose criado: $composeFile" -ForegroundColor Green
    
    return $composeFile
}

# Funcao para criar script de deploy
function Create-DeployScript {
    $deployScript = "deploy-$ClientId.ps1"
    
    Write-Host "Criando script de deploy: $deployScript" -ForegroundColor Blue
    
    $content = @"
#!/usr/bin/env pwsh
# ========================================
# SCRIPT DE DEPLOY PARA CLIENTE: ${ClientId}
# ========================================

Write-Host "Iniciando deploy para cliente: ${ClientName}" -ForegroundColor Green

# Verificar se os arquivos existem
if (-not (Test-Path "env.prod.${ClientId}")) {
    Write-Host "ERRO: Arquivo env.prod.${ClientId} nao encontrado!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "docker-compose.${ClientId}.yml")) {
    Write-Host "ERRO: Arquivo docker-compose.${ClientId}.yml nao encontrado!" -ForegroundColor Red
    exit 1
}

# Parar servicos existentes (se houver)
Write-Host "Parando servicos existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.${ClientId}.yml down 2>`$null

# Build das imagens
Write-Host "Fazendo build das imagens..." -ForegroundColor Blue
docker-compose -f docker-compose.${ClientId}.yml build

# Subir servicos
Write-Host "Subindo servicos..." -ForegroundColor Green
docker-compose -f docker-compose.${ClientId}.yml up -d

# Aguardar servicos estarem prontos
Write-Host "Aguardando servicos estarem prontos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "Verificando status dos servicos..." -ForegroundColor Blue
docker-compose -f docker-compose.${ClientId}.yml ps

Write-Host "Deploy concluido para cliente: ${ClientName}" -ForegroundColor Green
Write-Host "Frontend: http://localhost:`${FRONTEND_PORT:-80}" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:`${BACKEND_PORT:-8000}" -ForegroundColor Cyan
Write-Host "Banco: localhost:`${POSTGRES_PORT:-5432}" -ForegroundColor Cyan
Write-Host "Redis: localhost:`${REDIS_PORT:-6379}" -ForegroundColor Cyan
"@
    
    $content | Out-File -FilePath $deployScript -Encoding UTF8
    
    # Tornar executavel
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "OK: Script de deploy criado: $deployScript" -ForegroundColor Green
    
    return $deployScript
}

# Funcao principal
function Main {
    Write-Host "SCRIPT DE CRIACAO DE CLIENTES" -ForegroundColor Blue
    Write-Host "===============================" -ForegroundColor Blue
    
    # Validar entrada
    if ([string]::IsNullOrWhiteSpace($ClientName)) {
        Write-Host "ERRO: Nome do cliente e obrigatorio!" -ForegroundColor Red
        exit 1
    }
    
    if ([string]::IsNullOrWhiteSpace($ClientId)) {
        Write-Host "ERRO: ID do cliente e obrigatorio!" -ForegroundColor Red
        exit 1
    }
    
    # Mostrar resumo
    Write-Host "`nRESUMO DA CRIACAO:" -ForegroundColor Yellow
    Write-Host "   Nome do Cliente: $ClientName" -ForegroundColor Cyan
    Write-Host "   ID do Cliente: $ClientId" -ForegroundColor Cyan
    Write-Host "   Nome do Restaurante: $RestaurantName" -ForegroundColor Cyan
    Write-Host "   Dominio: $Domain" -ForegroundColor Cyan
    
    if (-not $SkipConfirmation) {
        Write-Host "`nConfirmar criacao? (S/N): " -ForegroundColor Yellow -NoNewline
        $confirm = Read-Host
        
        if ($confirm -notmatch '^[Ss]$') {
            Write-Host "Operacao cancelada pelo usuario." -ForegroundColor Red
            exit 0
        }
    }
    
    Write-Host "`nIniciando criacao do cliente..." -ForegroundColor Green
    
    try {
        # Criar arquivos
        $envInfo = Create-EnvironmentFile
        $composeFile = Create-DockerCompose
        $deployScript = Create-DeployScript
        
        # Resumo final
        Write-Host "`nCLIENTE CRIADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Arquivos criados:" -ForegroundColor Blue
        Write-Host "   • $($envInfo.EnvFile)" -ForegroundColor Cyan
        Write-Host "   • $composeFile" -ForegroundColor Cyan
        Write-Host "   • $deployScript" -ForegroundColor Cyan
        
        Write-Host "`nCredenciais geradas:" -ForegroundColor Blue
        Write-Host "   • Senha do Banco: $($envInfo.DbPassword)" -ForegroundColor Cyan
        Write-Host "   • Senha do Redis: $($envInfo.RedisPassword)" -ForegroundColor Cyan
        Write-Host "   • Chave Secreta: $($envInfo.SecretKey)" -ForegroundColor Cyan
        
        Write-Host "`nPara fazer deploy:" -ForegroundColor Blue
        Write-Host "   .\deploy-$ClientId.ps1" -ForegroundColor Cyan
        
        Write-Host "`nIMPORTANTE:" -ForegroundColor Yellow
        Write-Host "   • Salve as credenciais em local seguro" -ForegroundColor Yellow
        Write-Host "   • Nunca commite o arquivo env.prod.$ClientId no Git" -ForegroundColor Yellow
        Write-Host "   • Configure as portas no arquivo de ambiente se necessario" -ForegroundColor Yellow
        
    } catch {
        Write-Host "ERRO ao criar cliente: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Executar script
Main
