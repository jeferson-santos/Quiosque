# Script PowerShell para deploy em produção
param(
    [switch]$SkipBuild,
    [switch]$Force
)

Write-Host "🚀 INICIANDO DEPLOY EM PRODUÇÃO" -ForegroundColor Green
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
if (-not (Test-Path "../env.prod")) {
    Write-Host "❌ Arquivo env.prod não encontrado" -ForegroundColor Red
    Write-Host "💡 Copie env.prod.example para env.prod e configure as variáveis" -ForegroundColor Yellow
    exit 1
}

# Carregar variáveis de ambiente
Write-Host "🔧 Carregando configurações..." -ForegroundColor Yellow
Get-Content "../env.prod" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' } | ForEach-Object {
    $name, $value = $_.Split('=', 2)
    Set-Variable -Name $name -Value $value
}

Write-Host "🔧 Configurações carregadas:" -ForegroundColor Yellow
Write-Host "  📊 Banco: $POSTGRES_DB" -ForegroundColor White
Write-Host "  👤 Usuário: $POSTGRES_USER" -ForegroundColor White
Write-Host "  🔑 Debug: $DEBUG" -ForegroundColor White

# Parar serviços existentes
Write-Host "🛑 Parando serviços existentes..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.prod.yml down

if (-not $SkipBuild) {
    # Remover imagens antigas (opcional)
    Write-Host "🧹 Limpando imagens antigas..." -ForegroundColor Yellow
    docker image prune -f

    # Build das imagens
    Write-Host "🔨 Build das imagens..." -ForegroundColor Yellow
    docker-compose -f ../docker-compose.prod.yml build --no-cache
}

# Iniciar serviços
Write-Host "🚀 Iniciando serviços..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.prod.yml up -d

# Aguardar serviços estarem prontos
Write-Host "⏳ Aguardando serviços..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar status dos serviços
Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.prod.yml ps

# Verificar health checks
Write-Host "🏥 Verificando health checks..." -ForegroundColor Yellow
$services = @("postgres", "redis", "backend", "frontend")
foreach ($service in $services) {
    try {
        $result = docker-compose -f ../docker-compose.prod.yml exec -T $service healthcheck 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $service`: Saudável" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $service`: Problemas de saúde" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ⚠️ $service`: Health check não disponível" -ForegroundColor Yellow
    }
}

# Executar migrações
Write-Host "🔄 Executando migrações..." -ForegroundColor Yellow
try {
    docker-compose -f ../docker-compose.prod.yml exec -T backend poetry run alembic upgrade head
    Write-Host "✅ Migrações executadas" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao executar migrações" -ForegroundColor Yellow
}

# Executar setup inicial (se necessário)
Write-Host "🌱 Executando setup inicial..." -ForegroundColor Yellow
try {
    docker-compose -f ../docker-compose.prod.yml exec -T backend poetry run python scripts/quick_dev_setup.py
    Write-Host "✅ Setup inicial executado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao executar setup inicial" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 URLs dos serviços:" -ForegroundColor Yellow
Write-Host "  🌐 Frontend: http://localhost" -ForegroundColor White
Write-Host "  🔧 Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  🗄️  Banco: localhost:5432" -ForegroundColor White
Write-Host "  🔴 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📊 Status dos serviços:" -ForegroundColor Yellow
docker-compose -f ../docker-compose.prod.yml ps
Write-Host ""
Write-Host "📝 Logs dos serviços:" -ForegroundColor Yellow
Write-Host "  docker-compose -f ../docker-compose.prod.yml logs -f [servico]" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para parar: docker-compose -f ../docker-compose.prod.yml down" -ForegroundColor White
Write-Host "🔄 Para reiniciar: docker-compose -f ../docker-compose.prod.yml restart" -ForegroundColor White
