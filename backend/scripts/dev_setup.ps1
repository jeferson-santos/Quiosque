# Script PowerShell para inicializar o ambiente de desenvolvimento
Write-Host "🚀 INICIALIZANDO AMBIENTE DE DESENVOLVIMENTO" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

# Verificar se o Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando. Iniciando..." -ForegroundColor Red
    Write-Host "💡 Por favor, inicie o Docker Desktop e execute novamente" -ForegroundColor Yellow
    exit 1
}

# Iniciar serviços Docker
Write-Host "🐳 Iniciando serviços Docker..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar o banco estar pronto
Write-Host "⏳ Aguardando banco de dados..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verificar se o banco está funcionando
Write-Host "🔍 Testando conexão com o banco..." -ForegroundColor Yellow
try {
    $result = docker exec quiosque_postgres psql -U quiosque_user -d quiosque_db -c "SELECT 1" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados funcionando" -ForegroundColor Green
    } else {
        throw "Falha na conexão"
    }
} catch {
    Write-Host "❌ Erro ao conectar com o banco" -ForegroundColor Red
    exit 1
}

# Executar script de inicialização Python
Write-Host "🐍 Executando script de inicialização..." -ForegroundColor Yellow
Set-Location backend

if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    poetry install
    
    Write-Host "🌱 Executando setup de desenvolvimento..." -ForegroundColor Yellow
    poetry run python scripts/quick_dev_setup.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Setup concluído com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Setup falhou" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Poetry não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale o Poetry: https://python-poetry.org/docs/#installation" -ForegroundColor Yellow
    exit 1
}

Set-Location ..

Write-Host "`n🎉 AMBIENTE CONFIGURADO!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Iniciar backend: cd backend && poetry run dev" -ForegroundColor White
Write-Host "2. Iniciar frontend: cd frontend && npm run dev" -ForegroundColor White

Write-Host "`n🔑 CREDENCIAIS:" -ForegroundColor Yellow
Write-Host "  👑 Admin: admin / admin123" -ForegroundColor White
Write-Host "  👨‍💼 Waiter: waiter / waiter123" -ForegroundColor White

Write-Host "`n🌐 URLs:" -ForegroundColor Yellow
Write-Host "  📱 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  🔧 Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  📚 API Docs: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
