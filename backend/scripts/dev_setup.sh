#!/bin/bash

echo "🚀 INICIALIZANDO AMBIENTE DE DESENVOLVIMENTO"
echo "============================================================"

# Verificar se o Docker está rodando
echo "🔍 Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    echo "💡 Por favor, inicie o Docker e execute novamente"
    exit 1
fi
echo "✅ Docker está rodando"

# Iniciar serviços Docker
echo "🐳 Iniciando serviços Docker..."
docker-compose up -d

# Aguardar o banco estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 15

# Verificar se o banco está funcionando
echo "🔍 Testando conexão com o banco..."
if docker exec quiosque_postgres psql -U quiosque_user -d quiosque_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Banco de dados funcionando"
else
    echo "❌ Erro ao conectar com o banco"
    exit 1
fi

# Executar script de inicialização Python
echo "🐍 Executando script de inicialização..."
cd backend

if command -v poetry &> /dev/null; then
    echo "📦 Instalando dependências..."
    poetry install
    
    echo "🌱 Executando setup de desenvolvimento..."
    poetry run python scripts/dev_setup.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Setup concluído com sucesso!"
    else
        echo "❌ Setup falhou"
        exit 1
    fi
else
    echo "❌ Poetry não encontrado"
    echo "💡 Instale o Poetry: https://python-poetry.org/docs/#installation"
    exit 1
fi

cd ..

echo ""
echo "🎉 AMBIENTE CONFIGURADO!"
echo "============================================================"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Iniciar backend: cd backend && poetry run dev"
echo "2. Iniciar frontend: cd frontend && npm run dev"

echo ""
echo "🔑 CREDENCIAIS:"
echo "  👑 Admin: admin / admin123"
echo "  👨‍💼 Waiter: waiter / waiter123"

echo ""
echo "🌐 URLs:"
echo "  📱 Frontend: http://localhost:5173"
echo "  🔧 Backend: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"

echo ""
echo "============================================================"
