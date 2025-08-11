# Script para iniciar o ambiente de desenvolvimento no Windows
Write-Host "🚀 Iniciando Sistema de Quiosque..." -ForegroundColor Green

# Verificar se o Docker está rodando
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker primeiro." -ForegroundColor Red
    exit 1
}

# Iniciar serviços Docker
Write-Host "🐳 Iniciando serviços Docker..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar o banco estar pronto
Write-Host "⏳ Aguardando banco de dados..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Iniciar backend
Write-Host "🐍 Iniciando backend..." -ForegroundColor Yellow
Set-Location backend
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    poetry install
    Start-Process -NoNewWindow -FilePath "poetry" -ArgumentList "run", "dev"
} else {
    Write-Host "⚠️  Poetry não encontrado. Instalando dependências com pip..." -ForegroundColor Yellow
    pip install -r requirements.txt
    Start-Process -NoNewWindow -FilePath "python" -ArgumentList "main.py"
}
Set-Location ..

# Iniciar frontend
Write-Host "⚛️  Iniciando frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
Set-Location ..

Write-Host "✅ Sistema iniciado!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "🗄️  Banco: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar: Feche as janelas dos terminais e execute 'docker-compose down'" -ForegroundColor Yellow
