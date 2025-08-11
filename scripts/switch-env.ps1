# Script PowerShell para alternar entre ambientes de desenvolvimento e produção
param(
    [Parameter(Position=0)]
    [string]$Environment = "dev"
)

Write-Host "🔄 ALTERANDO PARA AMBIENTE: $Environment" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

switch ($Environment.ToLower()) {
    { $_ -in @("dev", "development") } {
        Write-Host "🖥️  Configurando ambiente de DESENVOLVIMENTO..." -ForegroundColor Yellow
        
        # Parar ambiente de produção se estiver rodando
        try {
            $prodStatus = docker-compose -f ../docker-compose.prod.yml ps 2>$null
            if ($prodStatus -match "Up") {
                Write-Host "🛑 Parando ambiente de produção..." -ForegroundColor Yellow
                docker-compose -f ../docker-compose.prod.yml down
            }
        } catch {
            # Ambiente de produção não está rodando
        }
        
        # Iniciar ambiente de desenvolvimento
        Write-Host "🚀 Iniciando ambiente de desenvolvimento..." -ForegroundColor Yellow
        Set-Location ..
        docker-compose up -d
        
        Write-Host "✅ Ambiente de DESENVOLVIMENTO ativo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 URLs:" -ForegroundColor Yellow
        Write-Host "  🌐 Frontend: http://localhost:5173" -ForegroundColor White
        Write-Host "  🔧 Backend: http://localhost:8000" -ForegroundColor White
        Write-Host "  📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
        Write-Host ""
        Write-Host "🔑 Credenciais: admin/admin123, waiter/waiter123" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Para trabalhar:" -ForegroundColor Yellow
        Write-Host "  cd backend; poetry run dev" -ForegroundColor White
        Write-Host "  cd frontend; npm run dev" -ForegroundColor White
        break
    }
    
    { $_ -in @("prod", "production") } {
        Write-Host "🚀 Configurando ambiente de PRODUÇÃO..." -ForegroundColor Yellow
        
        # Verificar se arquivo de ambiente existe
        if (-not (Test-Path "../env.prod")) {
            Write-Host "❌ Arquivo env.prod não encontrado!" -ForegroundColor Red
            Write-Host "💡 Execute: cp env.prod env.prod e configure as variáveis" -ForegroundColor Yellow
            exit 1
        }
        
        # Parar ambiente de desenvolvimento se estiver rodando
        try {
            $devStatus = docker-compose ps 2>$null
            if ($devStatus -match "Up") {
                Write-Host "🛑 Parando ambiente de desenvolvimento..." -ForegroundColor Yellow
                docker-compose down
            }
        } catch {
            # Ambiente de desenvolvimento não está rodando
        }
        
        # Executar deploy de produção
        Write-Host "🚀 Executando deploy de produção..." -ForegroundColor Yellow
        Set-Location ..
        .\scripts\deploy-prod.ps1
        
        Write-Host "✅ Ambiente de PRODUÇÃO ativo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 URLs:" -ForegroundColor Yellow
        Write-Host "  🌐 Frontend: http://localhost" -ForegroundColor White
        Write-Host "  🔧 Backend: http://localhost:8000" -ForegroundColor White
        Write-Host "  📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
        break
    }
    
    "status" {
        Write-Host "📊 STATUS DOS AMBIENTES:" -ForegroundColor Yellow
        Write-Host "============================================================" -ForegroundColor Cyan
        
        Write-Host "🖥️  DESENVOLVIMENTO:" -ForegroundColor Yellow
        try {
            $devStatus = docker-compose ps 2>$null
            if ($devStatus -match "Up") {
                Write-Host "  ✅ ATIVO" -ForegroundColor Green
                docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
            } else {
                Write-Host "  ❌ INATIVO" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ❌ INATIVO" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "🚀 PRODUÇÃO:" -ForegroundColor Yellow
        try {
            $prodStatus = docker-compose -f ../docker-compose.prod.yml ps 2>$null
            if ($prodStatus -match "Up") {
                Write-Host "  ✅ ATIVO" -ForegroundColor Green
                docker-compose -f ../docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
            } else {
                Write-Host "  ❌ INATIVO" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ❌ INATIVO" -ForegroundColor Red
        }
        break
    }
    
    "clean" {
        Write-Host "🧹 LIMPANDO TODOS OS AMBIENTES..." -ForegroundColor Yellow
        
        # Parar todos os serviços
        Write-Host "🛑 Parando serviços..." -ForegroundColor Yellow
        try { docker-compose down } catch { }
        try { docker-compose -f ../docker-compose.prod.yml down } catch { }
        
        # Limpar containers, imagens e volumes não utilizados
        Write-Host "🧹 Limpando recursos Docker..." -ForegroundColor Yellow
        docker system prune -f
        docker volume prune -f
        
        Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
        break
    }
    
    default {
        Write-Host "❌ Uso incorreto!" -ForegroundColor Red
        Write-Host ""
        Write-Host "📖 USO:" -ForegroundColor Yellow
        Write-Host "  .\switch-env.ps1 [ambiente]" -ForegroundColor White
        Write-Host ""
        Write-Host "🌍 AMBIENTES DISPONÍVEIS:" -ForegroundColor Yellow
        Write-Host "  dev, development  - Ambiente de desenvolvimento" -ForegroundColor White
        Write-Host "  prod, production  - Ambiente de produção" -ForegroundColor White
        Write-Host "  status            - Ver status dos ambientes" -ForegroundColor White
        Write-Host "  clean             - Limpar todos os ambientes" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 EXEMPLOS:" -ForegroundColor Yellow
        Write-Host "  .\switch-env.ps1 dev      # Ativar desenvolvimento" -ForegroundColor White
        Write-Host "  .\switch-env.ps1 prod     # Ativar produção" -ForegroundColor White
        Write-Host "  .\switch-env.ps1 status   # Ver status" -ForegroundColor White
        Write-Host "  .\switch-env.ps1 clean    # Limpar tudo" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
