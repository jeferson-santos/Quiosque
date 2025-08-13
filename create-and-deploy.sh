#!/bin/bash
# ========================================
# SCRIPT UNIFICADO: CRIAÇÃO E DEPLOY AUTOMÁTICO
# ========================================
# Este script cria um cliente e faz o deploy automaticamente
# Uso: ./create-and-deploy.sh -n "Nome do Cliente" -i "client_id" [-d "dominio"] [-r "Nome do Restaurante"]

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para verificar se uma porta está disponível
check_port_available() {
    local port=$1
    if command -v netstat >/dev/null 2>&1; then
        netstat -tln | grep -q ":$port " && return 1 || return 0
    elif command -v ss >/dev/null 2>&1; then
        ss -tln | grep -q ":$port " && return 1 || return 0
    else
        # Fallback: tentar conectar na porta
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1 && return 1 || return 0
    fi
}

# Função para encontrar próxima porta disponível
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while ! check_port_available $port; do
        log_color $YELLOW "⚠️ Porta $port está ocupada, tentando próxima..."
        port=$((port + 1))
        
        # Evitar loop infinito
        if [ $port -gt 65535 ]; then
            log_color $RED "❌ Erro: Não foi possível encontrar porta disponível"
            exit 1
        fi
    done
    
    echo $port
}

# Função para verificar se cliente já existe
check_client_exists() {
    local client_id="$1"
    local compose_file="docker-compose.$client_id.yml"
    local env_file=".env"
    
    if [[ -f "$compose_file" ]] || [[ -f "$env_file" ]]; then
        log_color $YELLOW "⚠️ Cliente '$client_id' já existe!"
        echo
        log_color $BLUE "📋 Arquivos encontrados:"
        [[ -f "$compose_file" ]] && log_color $BLUE "   • $compose_file"
        [[ -f "$env_file" ]] && log_color $BLUE "   • $env_file"
        echo
        
        # Verificar se containers estão rodando
        if [[ -f "$compose_file" ]]; then
            log_color $BLUE "🔍 Verificando containers existentes..."
            if docker compose -f "$compose_file" ps | grep -q "Up"; then
                log_color $YELLOW "   • Containers estão rodando"
            else
                log_color $BLUE "   • Containers não estão rodando"
            fi
        fi
        
        echo
        read -p "❓ Deseja recriar o cliente '$client_id'? Isso irá REMOVER TUDO! (S/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            log_color $YELLOW "🗑️ Recriando cliente '$client_id'..."
            remove_existing_client "$client_id"
            return 0
        else
            log_color $YELLOW "❌ Operação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    return 1
}

# Função para remover cliente existente
remove_existing_client() {
    local client_id="$1"
    local compose_file="docker-compose.$client_id.yml"
    
    log_color $RED "🗑️ Removendo cliente existente '$client_id'..."
    
    # Parar e remover containers
    if [[ -f "$compose_file" ]]; then
        log_color $BLUE "🛑 Parando containers..."
        docker compose -f "$compose_file" down -v 2>/dev/null || true
        
        log_color $BLUE "🗑️ Removendo containers..."
        docker compose -f "$compose_file" rm -f 2>/dev/null || true
    fi
    
    # Remover volumes
    log_color $BLUE "🗑️ Removendo volumes..."
    docker volume rm "quiosque_postgres_data_$client_id" 2>/dev/null || true
    
    # Remover redes (se não estiverem sendo usadas por outros clientes)
    log_color $BLUE "🗑️ Verificando redes..."
    if ! ls docker-compose.*.yml 2>/dev/null | grep -v "$client_id" >/dev/null; then
        docker network rm "quiosque_quiosque_network_$client_id" 2>/dev/null || true
    fi
    
    # Remover arquivos
    log_color $BLUE "🗑️ Removendo arquivos..."
    rm -f "$compose_file"
    rm -f ".env"
    
    # Remover imagens (opcional)
    read -p "❓ Deseja remover também as imagens Docker? (S/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_color $BLUE "🗑️ Removendo imagens..."
        docker rmi "quiosque-backend_$client_id" 2>/dev/null || true
        docker rmi "quiosque-frontend_$client_id" 2>/dev/null || true
    fi
    
    log_color $GREEN "✅ Cliente '$client_id' removido completamente!"
    echo
}

# Função para verificar e configurar portas disponíveis
configure_available_ports() {
    log_color $BLUE "🔍 Verificando portas disponíveis..."
    
    # Verificar porta do frontend (padrão: 80)
    local frontend_port=$(find_available_port 80)
    if [ $frontend_port -ne 80 ]; then
        log_color $YELLOW "⚠️ Porta 80 ocupada, usando porta $frontend_port para frontend"
    else
        log_color $GREEN "✅ Porta 80 disponível para frontend"
    fi
    
    # Verificar porta do backend (padrão: 8000)
    local backend_port=$(find_available_port 8000)
    if [ $backend_port -ne 8000 ]; then
        log_color $YELLOW "⚠️ Porta 8000 ocupada, usando porta $backend_port para backend"
    else
        log_color $GREEN "✅ Porta 8000 disponível para backend"
    fi
    
    # Verificar porta do PostgreSQL (padrão: 5432)
    local postgres_port=$(find_available_port 5432)
    if [ $postgres_port -ne 5432 ]; then
        log_color $YELLOW "⚠️ Porta 5432 ocupada, usando porta $postgres_port para PostgreSQL"
    else
        log_color $GREEN "✅ Porta 5432 disponível para PostgreSQL"
    fi
    
    # Verificar porta do Redis (padrão: 6379)
    local redis_port=$(find_available_port 6379)
    if [ $redis_port -ne 6379 ]; then
        log_color $YELLOW "⚠️ Porta 6379 ocupada, usando porta $redis_port para Redis"
    else
        log_color $GREEN "✅ Porta 6379 disponível para Redis"
    fi
    
    # Salvar portas escolhidas para uso posterior
    FRONTEND_PORT_CHOSEN=$frontend_port
    BACKEND_PORT_CHOSEN=$backend_port
    POSTGRES_PORT_CHOSEN=$postgres_port
    REDIS_PORT_CHOSEN=$redis_port
    
    log_color $GREEN "🎯 Portas configuradas:"
    log_color $GREEN "   Frontend: $frontend_port"
    log_color $GREEN "   Backend: $backend_port"
    log_color $GREEN "   PostgreSQL: $postgres_port"
    log_color $GREEN "   Redis: $redis_port"
}

# Função para mostrar ajuda
show_help() {
    echo "🚀 Script Unificado: Criação e Deploy Automático"
    echo "================================================"
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES OBRIGATÓRIAS:"
    echo "  -n, --name NAME        Nome do cliente (ex: 'Restaurante Exemplo')"
    echo "  -i, --id ID            ID do cliente (ex: 'exemplo')"
    echo
    echo "OPÇÕES OPCIONAIS:"
    echo "  -d, --domain DOMAIN    Domínio (ex: 'exemplo.com')"
    echo "  -r, --restaurant NAME  Nome do restaurante (ex: 'Restaurante Exemplo Ltda')"
    echo "  -e, --email EMAIL      Email para SSL (ex: 'admin@exemplo.com')"
    echo "  -p, --ports            Configurar portas personalizadas"
    echo "  -h, --help             Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -n 'Bater Do Mar' -i 'bater_do_mar'"
    echo "  $0 -n 'Sabor Brasileiro' -i 'saborbrasileiro' -d 'saborbrasileiro.com' -e 'admin@saborbrasileiro.com'"
    echo "  $0 -n 'Meu Restaurante' -i 'meurestaurante' -r 'Meu Restaurante Ltda' -d 'meurestaurante.com' -e 'admin@meurestaurante.com'"
    echo
    echo "📚 Para deploy em VPS Ubuntu, use: scripts/setup-vps-complete.sh"
    echo
    echo "🔍 DETECÇÃO AUTOMÁTICA DE PORTAS:"
    echo "   O script verifica automaticamente se as portas padrão estão ocupadas"
    echo "   e escolhe as próximas portas disponíveis automaticamente"
    echo
    echo "🔄 VERIFICAÇÃO DE CLIENTES EXISTENTES:"
    echo "   Se um cliente com o mesmo ID já existir, o script pergunta"
    echo "   se deseja recriar (remove tudo e cria novamente)"
    echo
}

# Função para gerar senhas seguras
generate_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-25
}

# Função para gerar chave secreta
generate_secret_key() {
    openssl rand -base64 32
}

# Função para criar arquivo de ambiente
create_env_file() {
    local client_name="$1"
    local client_id="$2"
    local domain="$3"
    local restaurant_name="$4"
    
    log_color $BLUE "📝 Criando arquivo de ambiente: .env"
    
    # Gerar credenciais seguras
    local db_password=$(generate_password)
    local redis_password=$(generate_password)
    local secret_key=$(generate_secret_key)
    
    # Salvar credenciais para exibição posterior
    DB_PASSWORD="$db_password"
    REDIS_PASSWORD="$redis_password"
    SECRET_KEY="$secret_key"
    
    # Usar portas escolhidas ou padrões se não foram configuradas
    local frontend_port=${FRONTEND_PORT_CHOSEN:-80}
    local backend_port=${BACKEND_PORT_CHOSEN:-8000}
    local postgres_port=${POSTGRES_PORT_CHOSEN:-5432}
    local redis_port=${REDIS_PORT_CHOSEN:-6379}
    
    # Criar arquivo .env
    cat > ".env" << EOF
# ========================================
# CONFIGURACOES DE PRODUCAO - SISTEMA DE QUIOSQUE
# ========================================
#
# IMPORTANTE: Este arquivo contem configuracoes especificas do cliente
# NUNCA commitar este arquivo no Git!

# ========================================
# IDENTIFICACAO DO CLIENTE
# ========================================
CLIENT_NAME=$client_name
CLIENT_ID=$client_id
ENVIRONMENT=production

# ========================================
# CONFIGURACOES DO BANCO DE DADOS
# ========================================
POSTGRES_DB=quiosque_$client_id
POSTGRES_USER=quiosque_$client_id
POSTGRES_PASSWORD=$db_password
POSTGRES_HOST=postgres_$client_id
POSTGRES_PORT=$postgres_port
DATABASE_URL=postgresql://quiosque_$client_id:$db_password@postgres_$client_id:$postgres_port/quiosque_$client_id

# ========================================
# CONFIGURACOES DE SEGURANCA
# ========================================
SECRET_KEY=$secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ========================================
# CONFIGURACOES DE CORS
# ========================================
CORS_ORIGINS=http://localhost:$frontend_port,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# ========================================
# CONFIGURACOES REDIS
# ========================================
REDIS_HOST=redis_$client_id
REDIS_PORT=$redis_port
REDIS_PASSWORD=$redis_password

# ========================================
# CONFIGURACOES DO SERVIDOR
# ========================================
HOST=0.0.0.0
PORT=$backend_port

# ========================================
# CONFIGURACOES DO FRONTEND (VITE)
# ========================================
VITE_API_BASE_URL=http://localhost:$backend_port
VITE_DEBUG=false

# ========================================
# CONFIGURACOES DE NEGOCIO
# ========================================
RESTAURANT_NAME=$restaurant_name

# ========================================
# CONFIGURACOES DE PORTAS (OPCIONAL)
# ========================================
BACKEND_PORT=$backend_port
FRONTEND_PORT=$frontend_port
POSTGRES_PORT=$postgres_port
REDIS_PORT=$redis_port
EOF

    log_color $GREEN "✅ Arquivo de ambiente criado: .env"
}

# Função para criar docker-compose
create_docker_compose() {
    local client_id="$1"
    local compose_file="docker-compose.$client_id.yml"
    
    log_color $BLUE "🐳 Criando docker-compose: $compose_file"
    
    cat > "$compose_file" << EOF
version: '3.8'

services:
  # PostgreSQL do cliente
  postgres_$client_id:
    image: postgres:15
    container_name: quiosque_postgres_$client_id
    environment:
      POSTGRES_DB: quiosque_$client_id
      POSTGRES_USER: quiosque_$client_id
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    ports:
      - "\${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data_$client_id:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - quiosque_network_$client_id
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quiosque_$client_id -d quiosque_$client_id"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis do cliente
  redis_$client_id:
    image: redis:7-alpine
    container_name: quiosque_redis_$client_id
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    restart: unless-stopped
    networks:
      - quiosque_network_$client_id

  # Backend do cliente
  backend_$client_id:
    build: ./backend
    container_name: quiosque_backend_$client_id
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
      postgres_$client_id:
        condition: service_healthy
      redis_$client_id:
        condition: service_started
    restart: unless-stopped
    networks:
      - quiosque_network_$client_id
    volumes:
      - ./logs:/app/logs

  # Frontend do cliente
  frontend_$client_id:
    build: ./frontend
    container_name: quiosque_frontend_$client_id
    ports:
      - "\${FRONTEND_PORT:-80}:80"
    depends_on:
      - backend_$client_id
    restart: unless-stopped
    networks:
      - quiosque_network_$client_id

networks:
  quiosque_network_$client_id:
    driver: bridge

volumes:
  postgres_data_$client_id:
EOF

    log_color $GREEN "✅ Docker-compose criado: $compose_file"
}

# Função para fazer deploy
deploy_client() {
    local client_id="$1"
    local client_name="$2"
    local compose_file="docker-compose.$client_id.yml"
    
    log_color $BLUE "🚀 Iniciando deploy para cliente: $client_name"
    
    # Verificar se os arquivos existem
    if [[ ! -f ".env" ]]; then
        log_color $RED "❌ Arquivo .env não encontrado!"
        exit 1
    fi
    
    if [[ ! -f "$compose_file" ]]; then
        log_color $RED "❌ Arquivo $compose_file não encontrado!"
        exit 1
    fi
    
    # Parar serviços existentes (se houver)
    log_color $BLUE "🛑 Parando serviços existentes..."
    docker compose -f "$compose_file" down 2>/dev/null || true
    
    # Build das imagens
    log_color $BLUE "🔨 Fazendo build das imagens..."
    docker compose -f "$compose_file" build
    
    # Subir serviços
    log_color $BLUE "🚀 Subindo serviços..."
    docker compose -f "$compose_file" up -d
    
    # Aguardar serviços estarem prontos
    log_color $BLUE "⏳ Aguardando serviços estarem prontos..."
    sleep 15
    
    # Verificar status
    log_color $BLUE "📊 Verificando status dos serviços..."
    docker compose -f "$compose_file" ps
    
    log_color $GREEN "🎉 Deploy concluído para cliente: $client_name"
    log_color $BLUE "🌐 Frontend: http://localhost:${FRONTEND_PORT_CHOSEN:-80}"
    log_color $BLUE "🔧 Backend: http://localhost:${BACKEND_PORT_CHOSEN:-8000}"
    log_color $BLUE "🗄️ Banco: localhost:${POSTGRES_PORT_CHOSEN:-5432}"
    log_color $BLUE "📝 Redis: localhost:${REDIS_PORT_CHOSEN:-6379}"
}

# Função para deploy automático do subdomínio
deploy_subdomain() {
    local client_id="$1"
    local client_name="$2"
    local domain="$3"
    local email="$4"
    
    log_color $BLUE "🌐 Iniciando deploy automático do subdomínio..."
    
    # Verificar se o script de deploy do subdomínio existe
    if [ -f "scripts/deploy-subdomain.sh" ]; then
        log_color $BLUE "📥 Script de deploy do subdomínio encontrado"
        
        # Tornar executável
        chmod +x scripts/deploy-subdomain.sh
        
        # Obter porta do frontend das portas escolhidas
        local frontend_port=${FRONTEND_PORT_CHOSEN:-80}
        
        log_color $BLUE "🔧 Configurando subdomínio: ${client_id}.${domain}"
        log_color $BLUE "🔌 Porta detectada: ${frontend_port}"
        
        # Executar script de deploy do subdomínio
        if sudo scripts/deploy-subdomain.sh -d "$domain" -s "$client_id" -p "$frontend_port" -e "$email"; then
            log_color $GREEN "✅ Deploy do subdomínio concluído com sucesso!"
            log_color $GREEN "🌐 Acesse: https://${client_id}.${domain}"
        else
            log_color $YELLOW "⚠️ Deploy do subdomínio falhou, mas o cliente foi criado"
            log_color $YELLOW "🔧 Execute manualmente: sudo scripts/deploy-subdomain.sh -d '$domain' -s '$client_id' -p '$frontend_port' -e '$email'"
        fi
    else
        log_color $YELLOW "⚠️ Script de deploy do subdomínio não encontrado"
        log_color $YELLOW "📥 Baixe o script: scripts/deploy-subdomain.sh"
    fi
}

# Função para mostrar resumo final
show_summary() {
    local client_name="$1"
    local client_id="$2"
    
    log_color $GREEN "🎉 CLIENTE CRIADO E DEPLOYADO COM SUCESSO!"
    log_color $GREEN "=============================================="
    
    echo
    log_color $BLUE "📁 Arquivos criados:"
    log_color $BLUE "   • .env"
    log_color $BLUE "   • docker-compose.$client_id.yml"
    
    echo
    log_color $BLUE "🔑 Credenciais geradas:"
    log_color $BLUE "   • Senha do Banco: $DB_PASSWORD"
    log_color $BLUE "   • Senha do Redis: $REDIS_PASSWORD"
    log_color $BLUE "   • Chave Secreta: $SECRET_KEY"
    
    echo
    log_color $BLUE "🚀 Para gerenciar o cliente:"
    log_color $BLUE "   • Ver status: docker compose -f docker-compose.$client_id.yml ps"
    log_color $BLUE "   • Ver logs: docker compose -f docker-compose.$client_id.yml logs -f"
    log_color $BLUE "   • Parar: docker compose -f docker-compose.$client_id.yml down"
    log_color $BLUE "   • Reiniciar: docker compose -f docker-compose.$client_id.yml restart"
    
    echo
    log_color $GREEN "🌐 PORTAS CONFIGURADAS:"
    log_color $GREEN "   • Frontend: http://localhost:${FRONTEND_PORT_CHOSEN:-80}"
    log_color $GREEN "   • Backend: http://localhost:${BACKEND_PORT_CHOSEN:-8000}"
    log_color $GREEN "   • PostgreSQL: localhost:${POSTGRES_PORT_CHOSEN:-5432}"
    log_color $GREEN "   • Redis: localhost:${REDIS_PORT_CHOSEN:-6379}"
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • Salve as credenciais em local seguro"
    log_color $YELLOW "   • Nunca commite o arquivo .env no Git"
    log_color $YELLOW "   • Configure as portas no arquivo .env se necessário"
    
    echo
    log_color $GREEN "📚 Para deploy em VPS Ubuntu, use: docs/deploy-vps-example.sh"
}

# Função principal
main() {
    # Variáveis
    local CLIENT_NAME=""
    local CLIENT_ID=""
    local DOMAIN=""
    local RESTAURANT_NAME=""
    local EMAIL=""
    
    # Verificar se há argumentos
    if [[ $# -eq 0 ]]; then
        show_help
        exit 1
    fi
    
    # Processar argumentos
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
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -r|--restaurant)
                RESTAURANT_NAME="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            -p|--ports)
                configure_available_ports
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_color $RED "❌ Opção desconhecida: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Validar argumentos obrigatórios
    if [[ -z "$CLIENT_NAME" ]]; then
        log_color $RED "❌ Nome do cliente é obrigatório (-n ou --name)"
        exit 1
    fi
    
    if [[ -z "$CLIENT_ID" ]]; then
        log_color $RED "❌ ID do cliente é obrigatório (-i ou --id)"
        exit 1
    fi
    
    # Definir valores padrão
    if [[ -z "$RESTAURANT_NAME" ]]; then
        RESTAURANT_NAME="$CLIENT_NAME"
    fi
    
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="localhost"
    fi
    
    # Mostrar resumo da criação
    log_color $GREEN "🎯 SCRIPT UNIFICADO: CRIAÇÃO E DEPLOY AUTOMÁTICO"
    log_color $GREEN "=================================================="
    echo
    log_color $BLUE "📋 RESUMO DA CRIAÇÃO:"
    log_color $BLUE "   Nome do Cliente: $CLIENT_NAME"
    log_color $BLUE "   ID do Cliente: $CLIENT_ID"
    log_color $BLUE "   Nome do Restaurante: $RESTAURANT_NAME"
    log_color $BLUE "   Domínio: $DOMAIN"
    echo
    
    # Confirmar criação
    read -p "❓ Confirmar criação e deploy? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Criação cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando criação e deploy automático..."
    
    # Verificar se cliente já existe
    check_client_exists "$CLIENT_ID"
    
    # Verificar e configurar portas disponíveis
    configure_available_ports
    
    # Criar arquivo de ambiente
    create_env_file "$CLIENT_NAME" "$CLIENT_ID" "$DOMAIN" "$RESTAURANT_NAME"
    
    # Criar docker-compose
    create_docker_compose "$CLIENT_ID"
    
    # Fazer deploy
    deploy_client "$CLIENT_ID" "$CLIENT_NAME"
    
    # Deploy automático do subdomínio se domínio e email foram fornecidos
    if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
        log_color $BLUE "🌐 Domínio e email fornecidos, iniciando deploy automático do subdomínio..."
        deploy_subdomain "$CLIENT_ID" "$CLIENT_NAME" "$DOMAIN" "$EMAIL"
    else
        log_color $YELLOW "⚠️ Domínio ou email não fornecidos, deploy do subdomínio será manual"
        if [[ -n "$DOMAIN" ]]; then
            log_color $BLUE "🔧 Para configurar subdomínio manualmente:"
            log_color $BLUE "   sudo scripts/deploy-subdomain.sh -d '$DOMAIN' -s '$CLIENT_ID' -e 'seu_email@exemplo.com'"
        fi
    fi
    
    # Mostrar resumo final
    show_summary "$CLIENT_NAME" "$CLIENT_ID"
}

# Executar função principal
main "$@"
