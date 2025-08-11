#!/bin/bash

echo "🚀 Iniciando Sistema de Quiosque..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Iniciar serviços Docker
echo "🐳 Iniciando serviços Docker..."
docker-compose up -d

# Aguardar o banco estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 10

# Iniciar backend
echo "🐍 Iniciando backend..."
cd backend
if command -v poetry &> /dev/null; then
    poetry install
    poetry run dev &
else
    echo "⚠️  Poetry não encontrado. Instalando dependências com pip..."
    pip install -r requirements.txt
    python main.py &
fi
cd ..

# Iniciar frontend
echo "⚛️  Iniciando frontend..."
cd frontend
npm install
npm run dev &
cd ..

echo "✅ Sistema iniciado!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "🗄️  Banco: localhost:5432"
echo ""
echo "Para parar: Ctrl+C e depois 'docker-compose down'"
