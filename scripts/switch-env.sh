#!/bin/bash

# Script para alternar entre ambientes de desenvolvimento e produção
set -e

ENV=${1:-dev}

echo "🔄 ALTERANDO PARA AMBIENTE: $ENV"
echo "============================================================"

case $ENV in
    "dev"|"development")
        echo "🖥️  Configurando ambiente de DESENVOLVIMENTO..."
        
        # Parar ambiente de produção se estiver rodando
        if docker-compose -f ../docker-compose.prod.yml ps | grep -q "Up"; then
            echo "🛑 Parando ambiente de produção..."
            docker-compose -f ../docker-compose.prod.yml down
        fi
        
        # Iniciar ambiente de desenvolvimento
        echo "🚀 Iniciando ambiente de desenvolvimento..."
        cd ..
        docker-compose up -d
        
        echo "✅ Ambiente de DESENVOLVIMENTO ativo!"
        echo ""
        echo "📋 URLs:"
        echo "  🌐 Frontend: http://localhost:5173"
        echo "  🔧 Backend: http://localhost:8000"
        echo "  📚 API Docs: http://localhost:8000/docs"
        echo ""
        echo "🔑 Credenciais: admin/admin123, waiter/waiter123"
        echo ""
        echo "📝 Para trabalhar:"
        echo "  cd backend && poetry run dev"
        echo "  cd frontend && npm run dev"
        ;;
        
    "prod"|"production")
        echo "🚀 Configurando ambiente de PRODUÇÃO..."
        
        # Verificar se arquivo de ambiente existe
        if [ ! -f "../env.prod" ]; then
            echo "❌ Arquivo env.prod não encontrado!"
            echo "💡 Execute: cp env.prod env.prod e configure as variáveis"
            exit 1
        fi
        
        # Parar ambiente de desenvolvimento se estiver rodando
        if docker-compose ps | grep -q "Up"; then
            echo "🛑 Parando ambiente de desenvolvimento..."
            docker-compose down
        fi
        
        # Executar deploy de produção
        echo "🚀 Executando deploy de produção..."
        cd ..
        ./scripts/deploy-prod.sh
        
        echo "✅ Ambiente de PRODUÇÃO ativo!"
        echo ""
        echo "📋 URLs:"
        echo "  🌐 Frontend: http://localhost"
        echo "  🔧 Backend: http://localhost:8000"
        echo "  📚 API Docs: http://localhost:8000/docs"
        ;;
        
    "status")
        echo "📊 STATUS DOS AMBIENTES:"
        echo "============================================================"
        
        echo "🖥️  DESENVOLVIMENTO:"
        if docker-compose ps | grep -q "Up"; then
            echo "  ✅ ATIVO"
            docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        else
            echo "  ❌ INATIVO"
        fi
        
        echo ""
        echo "🚀 PRODUÇÃO:"
        if docker-compose -f ../docker-compose.prod.yml ps | grep -q "Up"; then
            echo "  ✅ ATIVO"
            docker-compose -f ../docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        else
            echo "  ❌ INATIVO"
        fi
        ;;
        
    "clean")
        echo "🧹 LIMPANDO TODOS OS AMBIENTES..."
        
        # Parar todos os serviços
        echo "🛑 Parando serviços..."
        docker-compose down 2>/dev/null || true
        docker-compose -f ../docker-compose.prod.yml down 2>/dev/null || true
        
        # Limpar containers, imagens e volumes não utilizados
        echo "🧹 Limpando recursos Docker..."
        docker system prune -f
        docker volume prune -f
        
        echo "✅ Limpeza concluída!"
        ;;
        
    *)
        echo "❌ Uso incorreto!"
        echo ""
        echo "📖 USO:"
        echo "  ./switch-env.sh [ambiente]"
        echo ""
        echo "🌍 AMBIENTES DISPONÍVEIS:"
        echo "  dev, development  - Ambiente de desenvolvimento"
        echo "  prod, production  - Ambiente de produção"
        echo "  status            - Ver status dos ambientes"
        echo "  clean             - Limpar todos os ambientes"
        echo ""
        echo "💡 EXEMPLOS:"
        echo "  ./switch-env.sh dev      # Ativar desenvolvimento"
        echo "  ./switch-env.sh prod     # Ativar produção"
        echo "  ./switch-env.sh status   # Ver status"
        echo "  ./switch-env.sh clean    # Limpar tudo"
        exit 1
        ;;
esac

echo ""
echo "============================================================"
