#!/bin/bash
# ========================================
# SCRIPT DE CRIAÇÃO DE CLIENTES NOVOS
# ========================================
# 
# Este script automatiza a criação de um novo ambiente
# para um cliente específico do Sistema de Quiosque

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para gerar senha forte
generate_password() {
    openssl rand -base64 16 | tr -d "=+/" | cut -c1-16
}

# Função para gerar chave secreta
generate_secret_key() {
    openssl rand -base64 32
}

# Função para validar entrada
validate_input() {
    if [[ -z "$CLIENT_NAME" ]]; then
        log_color $RED "❌ Nome do cliente é obrigatório!"
        exit 1
    fi
    
    if [[ -z "$CLIENT_ID" ]]; then
        log_color $RED "❌ ID do cliente é obrigatório!"
        exit 1
    fi
    
    # Validar formato do ID (apenas letras, números e underscore)
    if [[ ! "$CLIENT_ID" =~ ^[a-zA-Z0-9_]+$ ]]; then
        log_color $RED "❌ ID do cliente deve conter apenas letras, números e underscore!"
        exit 1
    fi
}

# Função para criar arquivo de ambiente
create_environment_file() {
    local env_file=".env"
    local template_file="env.prod.example"
    
    if [[ ! -f "$template_file" ]]; then
        log_color $RED "❌ Arquivo env.prod não encontrado!"
        exit 1
    fi
    
    log_color $BLUE "📝 Criando arquivo de ambiente: $env_file"
    
    # Gerar senhas e chaves
    local db_password=$(generate_password)
    local redis_password=$(generate_password)
    local secret_key=$(generate_secret_key)
    
    # Ler template e substituir valores
    local content=$(cat "$template_file")
    
    # Substituições básicas
    content=$(echo "$content" | sed "s/CLIENT_NAME=.*/CLIENT_NAME=$CLIENT_NAME/")
    content=$(echo "$content" | sed "s/CLIENT_ID=.*/CLIENT_ID=$CLIENT_ID/")
    content=$(echo "$content" | sed "s/POSTGRES_DB=.*/POSTGRES_DB=quiosque_$CLIENT_ID/")
    content=$(echo "$content" | sed "s/POSTGRES_USER=.*/POSTGRES_USER=quiosque_$CLIENT_ID/")
    content=$(echo "$content" | sed "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$db_password/")
    content=$(echo "$content" | sed "s/SECRET_KEY=.*/SECRET_KEY=$secret_key/")
    content=$(echo "$content" | sed "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$redis_password/")
    
    # Substituições condicionais
    if [[ -n "$RESTAURANT_NAME" ]]; then
        content=$(echo "$content" | sed "s/RESTAURANT_NAME=.*/RESTAURANT_NAME=$RESTAURANT_NAME/")
    fi
    
    if [[ -n "$RESTAURANT_ADDRESS" ]]; then
        content=$(echo "$content" | sed "s/RESTAURANT_ADDRESS=.*/RESTAURANT_ADDRESS=$RESTAURANT_ADDRESS/")
    fi
    
    if [[ -n "$RESTAURANT_PHONE" ]]; then
        content=$(echo "$content" | sed "s/RESTAURANT_PHONE=.*/RESTAURANT_PHONE=$RESTAURANT_PHONE/")
    fi
    
    if [[ -n "$RESTAURANT_EMAIL" ]]; then
        content=$(echo "$content" | sed "s/RESTAURANT_EMAIL=.*/RESTAURANT_EMAIL=$RESTAURANT_EMAIL/")
    fi
    
    if [[ -n "$RESTAURANT_CNPJ" ]]; then
        content=$(echo "$content" | sed "s/RESTAURANT_CNPJ=.*/RESTAURANT_CNPJ=$RESTAURANT_CNPJ/")
    fi
    
    if [[ -n "$DOMAIN" ]]; then
        # Configurar CORS para o domínio do cliente
        content=$(echo "$content" | sed "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN|")
        
        # Configurar URL da API para o domínio do cliente
        local api_url="https://api.$DOMAIN"
        content=$(echo "$content" | sed "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=$api_url|")
        
        # Configurar CORS do frontend para o domínio do cliente
        local frontend_cors="https://$DOMAIN,https://www.$DOMAIN"
        content=$(echo "$content" | sed "s|VITE_CORS_ORIGINS=.*|VITE_CORS_ORIGINS=$frontend_cors|")
    else
        # Para desenvolvimento local, usar localhost
        content=$(echo "$content" | sed "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://localhost:8000|")
        content=$(echo "$content" | sed "s|VITE_CORS_ORIGINS=.*|VITE_CORS_ORIGINS=http://localhost:80,http://localhost:3000|")
    fi
    
    # Salvar arquivo
    echo "$content" > "$env_file"
    log_color $GREEN "✅ Arquivo de ambiente criado: .env"
    
    # Retornar informações
    ENV_FILE="$env_file"
    DB_PASSWORD="$db_password"
    REDIS_PASSWORD="$redis_password"
    SECRET_KEY="$secret_key"
}

# Função para criar docker-compose
create_docker_compose() {
    local compose_file="docker-compose.$CLIENT_ID.yml"
    
    log_color $BLUE "🐳 Criando docker-compose: $compose_file"
    
    cat > "$compose_file" << EOF
version: '3.8'

services:
  # Banco específico do cliente
  postgres_$CLIENT_ID:
    image: postgres:15
    container_name: quiosque_postgres_$CLIENT_ID
    environment:
      POSTGRES_DB: quiosque_$CLIENT_ID
      POSTGRES_USER: quiosque_$CLIENT_ID
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data_$CLIENT_ID:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - quiosque_network_$CLIENT_ID

  # Redis específico do cliente
  redis_$CLIENT_ID:
    image: redis:7-alpine
    container_name: quiosque_redis_$CLIENT_ID
    command: redis-server --requirepass \${REDIS_PASSWORD}
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    restart: unless-stopped
    networks:
      - quiosque_network_$CLIENT_ID

  # Backend do cliente
  backend_$CLIENT_ID:
    build: ./backend
    container_name: quiosque_backend_$CLIENT_ID
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - SECRET_KEY=\${SECRET_KEY}
      - ALGORITHM=\${ALGORITHM}
      - ACCESS_TOKEN_EXPIRE_MINUTES=\${ACCESS_TOKEN_EXPIRE_MINUTES}
      - REDIS_HOST=\${REDIS_HOST}
      - REDIS_PORT=\${REDIS_PORT}
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
      - CORS_ORIGINS=\${CORS_ORIGINS}
      - CORS_ALLOW_CREDENTIALS=\${CORS_ALLOW_CREDENTIALS}
    ports:
      - "\${BACKEND_PORT:-8000}:8000"
    depends_on:
      - postgres_$CLIENT_ID
      - redis_$CLIENT_ID
    restart: unless-stopped
    networks:
      - quiosque_network_$CLIENT_ID
    volumes:
      - ./logs:/app/logs

  # Frontend do cliente
  frontend_$CLIENT_ID:
    build: ./frontend
    container_name: quiosque_frontend_$CLIENT_ID
    ports:
      - "\${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend_$CLIENT_ID
    restart: unless-stopped
    networks:
      - quiosque_network_$CLIENT_ID

networks:
  quiosque_network_$CLIENT_ID:
    driver: bridge

volumes:
  postgres_data_$CLIENT_ID:
EOF

    log_color $GREEN "✅ Docker-compose criado: $compose_file"
    COMPOSE_FILE="$compose_file"
}

# Função para criar script de deploy
create_deploy_script() {
    local deploy_script="deploy-$CLIENT_ID.sh"
    
    log_color $BLUE "📜 Criando script de deploy: $deploy_script"
    
    cat > "$deploy_script" << 'EOF'
#!/bin/bash
# ========================================
# SCRIPT DE DEPLOY PARA CLIENTE: CLIENT_ID_PLACEHOLDER
# ========================================

echo "🚀 Iniciando deploy para cliente: CLIENT_NAME_PLACEHOLDER"

# Verificar se os arquivos existem
if [[ ! -f "env.prod.CLIENT_ID_PLACEHOLDER" ]]; then
    echo "❌ Arquivo env.prod.CLIENT_ID_PLACEHOLDER não encontrado!"
    exit 1
fi

if [[ ! -f "docker-compose.CLIENT_ID_PLACEHOLDER.yml" ]]; then
    echo "❌ Arquivo docker-compose.CLIENT_ID_PLACEHOLDER.yml não encontrado!"
    exit 1
fi

# Parar serviços existentes (se houver)
echo "🛑 Parando serviços existentes..."
docker-compose -f docker-compose.CLIENT_ID_PLACEHOLDER.yml down 2>/dev/null

# Build das imagens
echo "🔨 Fazendo build das imagens..."
docker-compose -f docker-compose.CLIENT_ID_PLACEHOLDER.yml build

# Subir serviços
echo "🚀 Subindo serviços..."
docker-compose -f docker-compose.CLIENT_ID_PLACEHOLDER.yml up -d

# Aguardar serviços estarem prontos
echo "⏳ Aguardando serviços estarem prontos..."
sleep 10

# Verificar status
echo "📊 Verificando status dos serviços..."
docker-compose -f docker-compose.CLIENT_ID_PLACEHOLDER.yml ps

# Executar migrações (se necessário)
echo "🗄️ Executando migrações do banco..."
if docker-compose -f docker-compose.CLIENT_ID_PLACEHOLDER.yml exec -T backend_CLIENT_ID_PLACEHOLDER alembic upgrade head; then
    echo "✅ Migrações executadas com sucesso!"
else
    echo "⚠️ Erro ao executar migrações"
fi

echo "🎉 Deploy concluído para cliente: CLIENT_NAME_PLACEHOLDER"
echo "🌐 Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "🔧 Backend: http://localhost:${BACKEND_PORT:-8000}"
echo "🗄️ Banco: localhost:${POSTGRES_PORT:-5432}"
echo "📝 Redis: localhost:${REDIS_PORT:-6379}"
EOF

    # Substituir placeholders
    sed -i "s/CLIENT_ID_PLACEHOLDER/$CLIENT_ID/g" "$deploy_script"
    sed -i "s/CLIENT_NAME_PLACEHOLDER/$CLIENT_NAME/g" "$deploy_script"
    
    # Tornar executável
    chmod +x "$deploy_script"
    log_color $GREEN "✅ Script de deploy criado: $deploy_script"
    DEPLOY_SCRIPT="$deploy_script"
}

# Função para criar README do cliente
create_client_readme() {
    local readme_file="README-$CLIENT_ID.md"
    
    log_color $BLUE "📚 Criando README: $readme_file"
    
    cat > "$readme_file" << EOF
# 🏪 Cliente: $CLIENT_NAME

## 📋 Informações Básicas

- **ID do Cliente:** $CLIENT_ID
- **Nome do Restaurante:** $RESTAURANT_NAME
- **Data de Criação:** $(date '+%d/%m/%Y %H:%M')

## 🚀 Como Usar

### 1. Deploy Inicial

\`\`\`bash
# Executar script de deploy
./deploy-$CLIENT_ID.sh
\`\`\`

### 2. Comandos Úteis

\`\`\`bash
# Ver status dos serviços
docker-compose -f docker-compose.$CLIENT_ID.yml ps

# Ver logs
docker-compose -f docker-compose.$CLIENT_ID.yml logs -f

# Parar serviços
docker-compose -f docker-compose.$CLIENT_ID.yml down

# Reiniciar serviços
docker-compose -f docker-compose.$CLIENT_ID.yml restart
\`\`\`

### 3. Acessos

- **Frontend:** http://localhost:\${FRONTEND_PORT:-80}
- **Backend:** http://localhost:\${BACKEND_PORT:-8000}
- **Banco:** localhost:\${POSTGRES_PORT:-5432}
- **Redis:** localhost:\${REDIS_PORT:-6379}

## 🔧 Configurações

- **Arquivo de Ambiente:** env.prod.$CLIENT_ID
- **Docker Compose:** docker-compose.$CLIENT_ID.yml
- **Script de Deploy:** deploy-$CLIENT_ID.sh

## 📝 Notas

- Este ambiente é independente de outros clientes
- Cada cliente tem seu próprio banco de dados e Redis
- As portas podem ser configuradas no arquivo de ambiente
EOF

    log_color $GREEN "✅ README criado: $readme_file"
    README_FILE="$readme_file"
}

# Função para mostrar ajuda
show_help() {
    echo "Uso: $0 [OPÇÕES]"
    echo ""
    echo "OPÇÕES OBRIGATÓRIAS:"
    echo "  -n, --name NAME        Nome do cliente"
    echo "  -i, --id ID            ID do cliente (apenas letras, números e underscore)"
    echo ""
    echo "OPÇÕES OPCIONAIS:"
    echo "  -r, --restaurant NAME  Nome do restaurante"
    echo "  -a, --address ADDR     Endereço do restaurante"
    echo "  -p, --phone PHONE      Telefone do restaurante"
    echo "  -e, --email EMAIL      Email do restaurante"
    echo "  -c, --cnpj CNPJ        CNPJ do restaurante"
    echo "  -d, --domain DOMAIN    Domínio para CORS"
    echo "  -y, --yes              Pular confirmação"
    echo "  -h, --help             Mostrar esta ajuda"
    echo ""
    echo "EXEMPLOS:"
    echo "  $0 -n 'Restaurante ABC' -i cliente_abc"
    echo "  $0 --name 'Restaurante XYZ' --id cliente_xyz --restaurant 'XYZ' --domain xyz.com"
    echo ""
}

# Função principal
main() {
    log_color $BLUE "🎯 SCRIPT DE CRIAÇÃO DE CLIENTES NOVOS"
    log_color $BLUE "========================================"
    
    # Validar entrada
    validate_input
    
    # Mostrar resumo
    log_color $YELLOW ""
    log_color $YELLOW "📋 RESUMO DA CRIAÇÃO:"
    log_color $CYAN "   Nome do Cliente: $CLIENT_NAME"
    log_color $CYAN "   ID do Cliente: $CLIENT_ID"
    log_color $CYAN "   Nome do Restaurante: $RESTAURANT_NAME"
    log_color $CYAN "   Domínio: $DOMAIN"
    
    if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
        log_color $YELLOW ""
        read -p "❓ Confirmar criação? (S/N): " confirm
        
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_color $RED "❌ Operação cancelada pelo usuário."
            exit 0
        fi
    fi
    
    log_color $GREEN ""
    log_color $GREEN "🚀 Iniciando criação do cliente..."
    
    # Criar arquivos
    create_environment_file
    create_docker_compose
    create_deploy_script
    create_client_readme
    
    # Resumo final
    log_color $GREEN ""
    log_color $GREEN "🎉 CLIENTE CRIADO COM SUCESSO!"
    log_color $GREEN "========================================"
    log_color $BLUE "📁 Arquivos criados:"
    log_color $CYAN "   • $ENV_FILE"
    log_color $CYAN "   • $COMPOSE_FILE"
    log_color $CYAN "   • $DEPLOY_SCRIPT"
    log_color $CYAN "   • $README_FILE"
    
    log_color $BLUE ""
    log_color $BLUE "🔑 Credenciais geradas:"
    log_color $CYAN "   • Senha do Banco: $DB_PASSWORD"
    log_color $CYAN "   • Senha do Redis: $REDIS_PASSWORD"
    log_color $CYAN "   • Chave Secreta: $SECRET_KEY"
    
    log_color $BLUE ""
    log_color $BLUE "🚀 Para fazer deploy:"
    log_color $CYAN "   ./deploy-$CLIENT_ID.sh"
    
    log_color $YELLOW ""
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • Salve as credenciais em local seguro"
    log_color $YELLOW "   • Nunca commite o arquivo env.prod.$CLIENT_ID no Git"
    log_color $YELLOW "   • Configure as portas no arquivo de ambiente se necessário"
}

# Processar argumentos da linha de comando
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            CLIENT_NAME="$2"
            shift 2
            ;;
        -i|--id)
            CLIENT_ID="$2"
            shift 2
            ;;
        -r|--restaurant)
            RESTAURANT_NAME="$2"
            shift 2
            ;;
        -a|--address)
            RESTAURANT_ADDRESS="$2"
            shift 2
            ;;
        -p|--phone)
            RESTAURANT_PHONE="$2"
            shift 2
            ;;
        -e|--email)
            RESTAURANT_EMAIL="$2"
            shift 2
            ;;
        -c|--cnpj)
            RESTAURANT_CNPJ="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRMATION="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Executar script
main
