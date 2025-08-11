# Script para configurar novo cliente em produção
param(
    [Parameter(Mandatory=$true)]
    [string]$ClientName,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$SecretKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$DbPassword = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RedisPassword = ""
)

Write-Host "🚀 CONFIGURANDO NOVO CLIENTE: $ClientName" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
if (-not (Test-Path "env.prod.example")) {
    Write-Host "❌ Arquivo env.prod.example não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute este script do diretório raiz do projeto" -ForegroundColor Yellow
    exit 1
}

# Gerar chaves se não fornecidas
if (-not $SecretKey) {
    $SecretKey = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "🔑 Chave secreta gerada automaticamente" -ForegroundColor Yellow
}

if (-not $DbPassword) {
    $DbPassword = -join ((33..126) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Host "🗄️  Senha do banco gerada automaticamente" -ForegroundColor Yellow
}

if (-not $RedisPassword) {
    $RedisPassword = -join ((33..126) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Host "🔴 Senha do Redis gerada automaticamente" -ForegroundColor Yellow
}

# Criar arquivo de configuração do cliente
$ClientConfigFile = "env.prod.$ClientId"
Write-Host "📝 Criando arquivo de configuração: $ClientConfigFile" -ForegroundColor Yellow

# Ler template e substituir valores
$TemplateContent = Get-Content "env.prod.example" -Raw

# Substituir variáveis específicas do cliente
$TemplateContent = $TemplateContent -replace "SEU_RESTAURANTE_AQUI", $ClientName
$TemplateContent = $TemplateContent -replace "cliente_XXX", $ClientId
$TemplateContent = $TemplateContent -replace "SUA_CHAVE_SECRETA_SUPER_FORTE_AQUI_2024!", $SecretKey
$TemplateContent = $TemplateContent -replace "SUA_SENHA_SUPER_FORTE_AQUI_2024!", $DbPassword
$TemplateContent = $TemplateContent -replace "SUA_SENHA_REDIS_AQUI_2024!", $RedisPassword
$TemplateContent = $TemplateContent -replace "https://seudominio.com,https://www.seudominio.com,https://api.seudominio.com", "https://$Domain,https://www.$Domain,https://api.$Domain"

# Salvar arquivo de configuração
$TemplateContent | Out-File -FilePath $ClientConfigFile -Encoding UTF8

Write-Host "✅ Arquivo de configuração criado: $ClientConfigFile" -ForegroundColor Green

# Criar docker-compose específico do cliente
$ComposeFile = "docker-compose.$ClientId.yml"
Write-Host "🐳 Criando docker-compose específico: $ComposeFile" -ForegroundColor Yellow

$ComposeContent = @"
version: '3.8'

services:
  # Banco de dados PostgreSQL
  postgres_$ClientId:
    image: postgres:15-alpine
    container_name: quiosque_postgres_$ClientId
    environment:
      POSTGRES_DB: quiosque_$ClientId
      POSTGRES_USER: quiosque_$ClientId
      POSTGRES_PASSWORD: $DbPassword
    volumes:
      - postgres_data_$ClientId:/var/lib/postgresql/data
      - ./backup/$ClientId:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quiosque_$ClientId -d quiosque_$ClientId"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - quiosque_network_$ClientId

  # Redis para cache e sessões
  redis_$ClientId:
    image: redis:7-alpine
    container_name: quiosque_redis_$ClientId
    command: redis-server --appendonly yes --requirepass $RedisPassword
    volumes:
      - redis_data_$ClientId:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - quiosque_network_$ClientId

  # Backend FastAPI
  backend_$ClientId:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: quiosque_backend_$ClientId
    environment:
      - DATABASE_URL=postgresql://quiosque_$ClientId:$DbPassword@postgres_$ClientId:5432/quiosque_$ClientId
      - REDIS_HOST=redis_$ClientId
      - REDIS_PORT=6379
      - REDIS_PASSWORD=$RedisPassword
      - SECRET_KEY=$SecretKey
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - CORS_ORIGINS=https://$Domain,https://www.$Domain
      - DEBUG=false
      - CLIENT_NAME=$ClientName
      - CLIENT_ID=$ClientId
    ports:
      - "8000:8000"
    depends_on:
      postgres_$ClientId:
        condition: service_healthy
      redis_$ClientId:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - quiosque_network_$ClientId
    volumes:
      - ./logs/$ClientId:/app/logs
    env_file:
      - $ClientConfigFile

  # Frontend React
  frontend_$ClientId:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: quiosque_frontend_$ClientId
    ports:
      - "80:80"
    depends_on:
      - backend_$ClientId
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - quiosque_network_$ClientId
    env_file:
      - $ClientConfigFile

volumes:
  postgres_data_$ClientId:
    driver: local
  redis_data_$ClientId:
    driver: local

networks:
  quiosque_network_$ClientId:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
"@

$ComposeContent | Out-File -FilePath $ComposeFile -Encoding UTF8

Write-Host "✅ Docker-compose criado: $ComposeFile" -ForegroundColor Green

# Criar diretórios necessários
$Directories = @("logs/$ClientId", "backup/$ClientId")
foreach ($Dir in $Directories) {
    if (-not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        Write-Host "📁 Diretório criado: $Dir" -ForegroundColor Yellow
    }
}

# Criar script de deploy específico
$DeployScript = "scripts/deploy-$ClientId.ps1"
Write-Host "📜 Criando script de deploy: $DeployScript" -ForegroundColor Yellow

$DeployContent = @"
# Script de deploy para cliente: $ClientName
Write-Host "🚀 DEPLOY PARA CLIENTE: $ClientName" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Verificar se o Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando" -ForegroundColor Red
    exit 1
}

# Verificar se o arquivo de ambiente existe
if (-not (Test-Path "../$ClientConfigFile")) {
    Write-Host "❌ Arquivo $ClientConfigFile não encontrado!" -ForegroundColor Red
    exit 1
}

# Parar serviços existentes
Write-Host "🛑 Parando serviços existentes..." -ForegroundColor Yellow
docker-compose -f ../$ComposeFile down 2>`$null

# Build das imagens
Write-Host "🔨 Build das imagens..." -ForegroundColor Yellow
docker-compose -f ../$ComposeFile build --no-cache

# Iniciar serviços
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
docker-compose -f ../$ComposeFile up -d

# Aguardar serviços estarem prontos
Write-Host "⏳ Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status dos serviços
Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow
docker-compose -f ../$ComposeFile ps

Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO PARA: $ClientName" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 URLs dos serviços:" -ForegroundColor Yellow
Write-Host "  🌐 Frontend: http://localhost" -ForegroundColor White
Write-Host "  🔧 Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Yellow
Write-Host "  Ver status: docker-compose -f $ComposeFile ps" -ForegroundColor White
Write-Host "  Ver logs: docker-compose -f $ComposeFile logs -f" -ForegroundColor White
Write-Host "  Parar: docker-compose -f $ComposeFile down" -ForegroundColor White
"@

$DeployContent | Out-File -FilePath $DeployScript -Encoding UTF8

Write-Host "✅ Script de deploy criado: $DeployScript" -ForegroundColor Green

# Resumo final
Write-Host ""
Write-Host "🎉 CLIENTE CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 ARQUIVOS CRIADOS:" -ForegroundColor Yellow
Write-Host "  🔧 Configuração: $ClientConfigFile" -ForegroundColor White
Write-Host "  🐳 Docker-compose: $ComposeFile" -ForegroundColor White
Write-Host "  📜 Script de deploy: $DeployScript" -ForegroundColor White
Write-Host ""
Write-Host "🔑 INFORMAÇÕES DE SEGURANÇA:" -ForegroundColor Yellow
Write-Host "  Chave JWT: $SecretKey" -ForegroundColor White
Write-Host "  Senha DB: $DbPassword" -ForegroundColor White
Write-Host "  Senha Redis: $RedisPassword" -ForegroundColor White
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Revisar e ajustar $ClientConfigFile" -ForegroundColor White
Write-Host "2. Executar deploy: .\scripts\deploy-$ClientId.ps1" -ForegroundColor White
Write-Host "3. Configurar domínio e SSL se necessário" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "  - NUNCA commite $ClientConfigFile no Git" -ForegroundColor White
Write-Host "  - Guarde as senhas em local seguro" -ForegroundColor White
Write-Host "  - Configure backup automático" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
