#!/bin/bash

# Script para deploy em produção
set -e

echo "🚀 INICIANDO DEPLOY EM PRODUÇÃO"
echo "============================================================"

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

# Verificar se o arquivo de ambiente existe
if [ ! -f "../env.prod" ]; then
    echo "❌ Arquivo env.prod não encontrado"
    echo "💡 Copie env.prod.example para env.prod e configure as variáveis"
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat ../env.prod | grep -v '^#' | xargs)

echo "🔧 Configurações carregadas:"
echo "  📊 Banco: $POSTGRES_DB"
echo "  👤 Usuário: $POSTGRES_USER"
echo "  🔑 Debug: $DEBUG"

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose -f ../docker-compose.prod.yml down

# Remover imagens antigas (opcional)
echo "🧹 Limpando imagens antigas..."
docker image prune -f

# Build das imagens
echo "🔨 Build das imagens..."
docker-compose -f ../docker-compose.prod.yml build --no-cache

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose -f ../docker-compose.prod.yml up -d

# Aguardar serviços estarem prontos
echo "⏳ Aguardando serviços..."
sleep 30

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose -f ../docker-compose.prod.yml ps

# Verificar health checks
echo "🏥 Verificando health checks..."
for service in postgres redis backend frontend; do
    if docker-compose -f ../docker-compose.prod.yml exec -T $service healthcheck 2>/dev/null; then
        echo "  ✅ $service: Saudável"
    else
        echo "  ❌ $service: Problemas de saúde"
    fi
done

# Executar migrações
echo "🔄 Executando migrações..."
docker-compose -f ../docker-compose.prod.yml exec -T backend poetry run alembic upgrade head

# Executar setup inicial (se necessário)
echo "🌱 Executando setup inicial..."
docker-compose -f ../docker-compose.prod.yml exec -T backend poetry run python scripts/quick_dev_setup.py

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================================"
echo ""
echo "📋 URLs dos serviços:"
echo "  🌐 Frontend: http://localhost"
echo "  🔧 Backend: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo "  🗄️  Banco: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo ""
echo "📊 Status dos serviços:"
docker-compose -f ../docker-compose.prod.yml ps
echo ""
echo "📝 Logs dos serviços:"
echo "  docker-compose -f ../docker-compose.prod.yml logs -f [servico]"
echo ""
echo "🛑 Para parar: docker-compose -f ../docker-compose.prod.yml down"
echo "🔄 Para reiniciar: docker-compose -f ../docker-compose.prod.yml restart"
