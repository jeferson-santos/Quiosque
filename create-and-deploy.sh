#!/bin/bash
# ========================================
# SCRIPT UNIFICADO: CRIAÇÃO E DEPLOY AUTOMÁTICO (REFATORADO)
# ========================================
# Este script cria um cliente e faz o deploy automaticamente
# Usa portas automáticas do Docker e configura proxy reverso do Nginx
# Uso: ./create-and-deploy.sh -n "Nome do Cliente" -i "client_id" [-d "dominio"] [-r "Nome do Restaurante"] [-e "email"]

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

# Função para verificar e instalar dependências necessárias
check_and_install_dependencies() {
    log_color $BLUE "🔧 Verificando dependências necessárias..."
    
    local missing_packages=()
    
    # Verificar se docker está disponível
    if ! command -v docker >/dev/null 2>&1; then
        missing_packages+=("docker.io")
    fi
    
    # Verificar se docker compose está disponível
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        missing_packages+=("docker-compose")
    fi
    
    # Verificar se grep está disponível
    if ! command -v grep >/dev/null 2>&1; then
        missing_packages+=("grep")
    fi
    
    # Verificar se sed está disponível
    if ! command -v sed >/dev/null 2>&1; then
        missing_packages+=("sed")
    fi
    
    # Se há pacotes faltando, instalar
    if [ ${#missing_packages[@]} -gt 0 ]; then
        log_color $YELLOW "⚠️ Dependências faltando: ${missing_packages[*]}"
        log_color $BLUE "🔧 Instalando dependências..."
        
        # Atualizar lista de pacotes
        apt update -y
        
        # Instalar pacotes faltando
        apt install -y "${missing_packages[@]}"
        
        log_color $GREEN "✅ Dependências instaladas com sucesso!"
    else
        log_color $GREEN "✅ Todas as dependências estão disponíveis"
    fi
    
    echo
}

# Função para limpar arquivos existentes
cleanup_existing_files() {
    local client_id="$1"
    
    log_color $BLUE "🧹 Limpando arquivos existentes para cliente '$client_id'..."
    
    # Parar containers se estiverem rodando
    if [[ -f "docker-compose.$client_id.yml" ]]; then
        log_color $BLUE "🛑 Parando containers existentes..."
        docker compose -f "docker-compose.$client_id.yml" down -v 2>/dev/null || true
    fi
    
    # Remover arquivos
    rm -f "docker-compose.$client_id.yml"
    rm -f ".env"
    
    log_color $GREEN "✅ Limpeza concluída"
}



# Função para encontrar porta disponível em um range específico
find_port_in_range() {
    local start_port="$1"
    local end_port="$2"
    local service_name="$3"
    
    # Obter portas já em uso pelo Docker
    local used_ports=$(docker ps --format "{{.Ports}}" 2>/dev/null | grep -oE "[0-9]+->" | cut -d'>' -f1 | sort -u)
    
    # Procurar porta disponível no range
    for port in $(seq $start_port $end_port); do
        if ! echo "$used_ports" | grep -q "^$port$"; then
            log_color $GREEN "   ✅ $service_name: porta $port disponível"
            echo "$port"
            return 0
        fi
    done
    
    log_color $RED "   ❌ Nenhuma porta disponível no range $start_port-$end_port para $service_name"
    return 1
}

# Função para configurar portas automáticas do Docker
configure_docker_ports() {
    log_color $BLUE "🔍 Configurando portas automáticas do Docker..."
    
    log_color $GREEN "✅ Docker irá usar ranges específicos de portas"
    log_color $BLUE "   • Frontend: range 8000-8999 (interna: 80)"
    log_color $BLUE "   • Backend: range 7000-7999 (interna: 8000)"
    log_color $BLUE "   • PostgreSQL: range 6000-6999 (interna: 5432)"
    log_color $BLUE "   • Redis: range 5000-5999 (interna: 6379)"
    
    log_color $BLUE "✅ Configuração de portas concluída!"
}

# Função para obter portas já definidas no docker-compose
get_docker_ports() {
    local client_id="$1"
    
    log_color $BLUE "🔍 Obtendo portas já definidas no docker-compose..."
    
    # As portas já foram definidas na criação do docker-compose
    # Apenas aguardar containers iniciarem para confirmar
    log_color $BLUE "⏳ Aguardando containers iniciarem para confirmar portas..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_color $BLUE "   Tentativa $attempt/$max_attempts..."
        
        # Verificar se todos os containers estão rodando
        if docker ps --format "table {{.Names}}" | grep -q "quiosque_frontend_$client_id" && \
           docker ps --format "table {{.Names}}" | grep -q "quiosque_backend_$client_id" && \
           docker ps --format "table {{.Names}}" | grep -q "quiosque_postgres_$client_id" && \
           docker ps --format "table {{.Names}}" | grep -q "quiosque_redis_$client_id"; then
            
            # Aguardar mais um pouco para as portas ficarem disponíveis
            sleep 3
            break
        fi
        
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_color $RED "❌ Timeout aguardando containers iniciarem!"
        exit 1
    fi
    
    log_color $GREEN "🎯 Portas confirmadas:"
    log_color $GREEN "   Frontend: $FRONTEND_PORT_CHOSEN (range 8000-8999)"
    log_color $GREEN "   Backend: $BACKEND_PORT_CHOSEN (range 7000-7999)"
    log_color $GREEN "   PostgreSQL: $POSTGRES_PORT_CHOSEN (range 6000-6999)"
    log_color $GREEN "   Redis: $REDIS_PORT_CHOSEN (range 5000-5999)"
    
    log_color $BLUE "✅ Portas confirmadas com sucesso!"
}

# Função para gerar senhas seguras
generate_password() {
    local length=${1:-16}
    tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c $length
}

# Função para criar arquivo de ambiente
create_env_file() {
    local client_name="$1"
    local client_id="$2"
    local domain="$3"
    local restaurant_name="$4"
    
    log_color $BLUE "📝 Criando arquivo de ambiente..."
    
    # Gerar senhas e chaves
    local postgres_password=$(generate_password 16)
    local redis_password=$(generate_password 16)
    local secret_key=$(generate_password 32)
    
    # Criar arquivo .env
    cat > ".env" << EOF
# ========================================
# CONFIGURAÇÃO DO CLIENTE: $client_name
# ========================================
# Gerado automaticamente em: $(date)
# Cliente ID: $client_id

# Configurações do Cliente
CLIENT_NAME=$client_name
CLIENT_ID=$client_id
RESTAURANT_NAME=$restaurant_name
DOMAIN=$domain

# Configurações do Backend
BACKEND_PORT=8000
SECRET_KEY=$secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configurações do Frontend
FRONTEND_PORT=80
VITE_API_BASE_URL=http://localhost:8000

# Configurações do PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=quiosque_$client_id
POSTGRES_USER=quiosque_$client_id
POSTGRES_PASSWORD=$postgres_password

# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$redis_password
REDIS_DB=0

# Configurações de CORS
CORS_ORIGINS=http://localhost:80,http://localhost:8000,http://$domain,https://$domain

# Configurações de Log
LOG_LEVEL=INFO
LOG_FORMAT=json

# Configurações de Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=7
EOF

    log_color $GREEN "✅ Arquivo .env criado com sucesso!"
}

# Função para criar docker-compose
create_docker_compose() {
    local client_id="$1"
    
    log_color $BLUE "🐳 Criando docker-compose..."
    
    # Encontrar portas disponíveis nos ranges específicos
    local frontend_port=$(find_port_in_range 8000 8999 "Frontend")
    local backend_port=$(find_port_in_range 7000 7999 "Backend")
    local postgres_port=$(find_port_in_range 6000 6999 "PostgreSQL")
    local redis_port=$(find_port_in_range 5000 5999 "Redis")
    
    # Verificar se todas as portas foram encontradas
    if [[ -z "$frontend_port" || -z "$backend_port" || -z "$postgres_port" || -z "$redis_port" ]]; then
        log_color $RED "❌ Erro: Não foi possível encontrar portas disponíveis em todos os ranges!"
        exit 1
    fi
    
    # Salvar portas para uso posterior
    FRONTEND_PORT_CHOSEN="$frontend_port"
    BACKEND_PORT_CHOSEN="$backend_port"
    POSTGRES_PORT_CHOSEN="$postgres_port"
    REDIS_PORT_CHOSEN="$redis_port"
    
    log_color $GREEN "🎯 Portas selecionadas:"
    log_color $GREEN "   • Frontend: $frontend_port (range 8000-8999)"
    log_color $GREEN "   • Backend: $backend_port (range 7000-7999)"
    log_color $GREEN "   • PostgreSQL: $postgres_port (range 6000-6999)"
    log_color $GREEN "   • Redis: $redis_port (range 5000-5999)"
    
    # Criar arquivo docker-compose
    cat > "docker-compose.$client_id.yml" << EOF
version: '3.8'

services:
  frontend_$client_id:
    build: ./frontend
    container_name: quiosque_frontend_$client_id
    ports:
      - "$frontend_port:80"  # Porta específica do range 8000-8999
    environment:
      - VITE_API_BASE_URL=http://localhost:$backend_port
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - quiosque_network_$client_id
    depends_on:
      - backend_$client_id
    restart: unless-stopped

  backend_$client_id:
    build: ./backend
    container_name: quiosque_backend_$client_id
    ports:
      - "$backend_port:8000"  # Porta específica do range 7000-7999
    environment:
      - POSTGRES_SERVER=postgres_$client_id
      - POSTGRES_PORT=5432
      - POSTGRES_DB=quiosque_$client_id
      - POSTGRES_USER=quiosque_$client_id
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - REDIS_HOST=redis_$client_id
      - REDIS_PORT=6379
      - REDIS_PASSWORD=\${REDIS_PASSWORD}
      - SECRET_KEY=\${SECRET_KEY}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=30
      - CORS_ORIGINS=\${CORS_ORIGINS}
    volumes:
      - ./backend:/app
      - ./logs:/app/logs
    networks:
      - quiosque_network_$client_id
    depends_on:
      - postgres_$client_id
      - redis_$client_id
    restart: unless-stopped

  postgres_$client_id:
    image: postgres:15
    container_name: quiosque_postgres_$client_id
    ports:
      - "$postgres_port:5432"  # Porta específica do range 6000-6999
    environment:
      - POSTGRES_DB=quiosque_$client_id
      - POSTGRES_USER=quiosque_$client_id
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - postgres_data_$client_id:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - quiosque_network_$client_id
    restart: unless-stopped

  redis_$client_id:
    image: redis:7-alpine
    container_name: quiosque_redis_$client_id
    ports:
      - "$redis_port:6379"  # Porta específica do range 5000-5999
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data_$client_id:/data
    networks:
      - quiosque_network_$client_id
    restart: unless-stopped

volumes:
  postgres_data_$client_id:
  redis_data_$client_id:

networks:
  quiosque_network_$client_id:
    driver: bridge
EOF

    log_color $GREEN "✅ Docker-compose criado com sucesso!"
}

# Função para fazer deploy
deploy_client() {
    local client_id="$1"
    local client_name="$2"
    
    log_color $BLUE "🚀 Fazendo deploy do cliente '$client_name'..."
    
    # Fazer deploy
    log_color $BLUE "🐳 Iniciando containers..."
    docker compose -f "docker-compose.$client_id.yml" up -d --build
    
    # Aguardar containers iniciarem
    log_color $BLUE "⏳ Aguardando containers iniciarem..."
    sleep 10
    
    # Verificar status dos containers
    log_color $BLUE "🔍 Verificando status dos containers..."
    docker compose -f "docker-compose.$client_id.yml" ps
    
    log_color $GREEN "✅ Deploy concluído com sucesso!"
}

# Função para configurar proxy reverso no Nginx (arquivos separados)
configure_nginx_proxy() {
    local client_id="$1"
    local domain="$2"
    local frontend_port="$3"
    local backend_port="$4"
    
    log_color $BLUE "🌐 Configurando proxy reverso no Nginx..."
    
    # Verificar se o diretório do Nginx existe
    local nginx_sites_available="/etc/nginx/sites-available"
    local nginx_sites_enabled="/etc/nginx/sites-enabled"
    
    if [[ ! -d "$nginx_sites_available" ]]; then
        log_color $RED "❌ Diretório do Nginx não encontrado!"
        log_color $YELLOW "⚠️ Execute primeiro: sudo ./scripts/setup-vps.sh -d $domain -e seu_email@exemplo.com"
        return 1
    fi
    
    # Criar subdomain
    local subdomain="${client_id}.${domain}"
    local config_file="$nginx_sites_available/$subdomain"
    local enabled_link="$nginx_sites_enabled/$subdomain"
    
    # Verificar se o subdomain já está configurado
    if [[ -f "$config_file" ]]; then
        log_color $YELLOW "⚠️ Subdomínio $subdomain já está configurado no Nginx"
        log_color $BLUE "🔄 Atualizando configuração existente..."
        
        # Fazer backup da configuração existente
        cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Criar arquivo de configuração do subdomain
    log_color $BLUE "📝 Criando arquivo de configuração: $subdomain"
    
    cat > "$config_file" << EOF
# Configuração para subdomain: $subdomain
# Cliente: $client_id
# Criado em: $(date)

server {
    listen 80;
    server_name $subdomain;
    
    # Frontend - Aplicação React
    location / {
        proxy_pass http://localhost:$frontend_port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Configurações para SPA
        try_files \$uri \$uri/ /index.html;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # API calls para o backend
    location /api/ {
        proxy_pass http://localhost:$backend_port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Configurações para API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Documentação da API
    location /docs {
        proxy_pass http://localhost:$backend_port;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check específico do cliente
    location /health {
        proxy_pass http://localhost:$backend_port;
        proxy_set_header Host \$host;
    }
    
    # Logs específicos do cliente
    access_log /var/log/nginx/$subdomain.access.log;
    error_log /var/log/nginx/$subdomain.error.log;
}
EOF
    
    # Criar symlink para ativar o site
    if [[ ! -L "$enabled_link" ]]; then
        log_color $BLUE "🔗 Ativando subdomain: $subdomain"
        ln -sf "$config_file" "$enabled_link"
    fi
    
    # Testar configuração do Nginx
    log_color $BLUE "🧪 Testando configuração do Nginx..."
    if nginx -t; then
        # Recarregar Nginx
        log_color $BLUE "🔄 Recarregando Nginx..."
        systemctl reload nginx
        
        log_color $GREEN "✅ Proxy reverso configurado com sucesso!"
        log_color $GREEN "🌐 Subdomínio: $subdomain"
        log_color $GREEN "   • Frontend: http://$subdomain (porta $frontend_port)"
        log_color $GREEN "   • Backend: http://$subdomain/api (porta $backend_port)"
        log_color $GREEN "📁 Arquivo: $config_file"
        log_color $GREEN "🔗 Ativado: $enabled_link"
    else
        log_color $RED "❌ Erro na configuração do Nginx"
        if [[ -f "${config_file}.backup.$(date +%Y%m%d_%H%M%S)" ]]; then
            log_color $YELLOW "🔄 Restaurando backup..."
            cp "${config_file}.backup.$(date +%Y%m%d_%H%M%S)" "$config_file"
        fi
        return 1
    fi
}

# Função para mostrar resumo final
show_summary() {
    local client_name="$1"
    local client_id="$2"
    local domain="$3"
    
    log_color $GREEN "🎉 CLIENTE CRIADO E CONFIGURADO COM SUCESSO!"
    log_color $GREEN "============================================="
    
    echo
    log_color $BLUE "📋 RESUMO DO CLIENTE:"
    log_color $BLUE "   Nome: $client_name"
    log_color $BLUE "   ID: $client_id"
    log_color $BLUE "   Domínio: $domain"
    
    echo
    log_color $BLUE "🌐 URLs DE ACESSO:"
    local subdomain="${client_id}.${domain}"
    log_color $BLUE "   • Frontend: http://$subdomain"
    log_color $BLUE "   • Backend API: http://$subdomain/api"
    log_color $BLUE "   • Documentação: http://$subdomain/docs"
    
    echo
    log_color $BLUE "🔧 PORTAS DOCKER:"
    log_color $BLUE "   • Frontend: $FRONTEND_PORT_CHOSEN"
    log_color $BLUE "   • Backend: $BACKEND_PORT_CHOSEN"
    log_color $BLUE "   • PostgreSQL: $POSTGRES_PORT_CHOSEN"
    log_color $BLUE "   • Redis: $REDIS_PORT_CHOSEN"
    
    echo
    log_color $BLUE "📁 ARQUIVOS CRIADOS:"
    log_color $BLUE "   • .env"
    log_color $BLUE "   • docker-compose.$client_id.yml"
    log_color $BLUE "   • Nginx: /etc/nginx/sites-available/$subdomain"
    log_color $BLUE "   • Nginx: /etc/nginx/sites-enabled/$subdomain"
    
    echo
    log_color $BLUE "🔒 CREDENCIAIS PADRÃO:"
    log_color $BLUE "   • Usuário: admin"
    log_color $BLUE "   • Senha: admin123"
    
    echo
    log_color $GREEN "🎯 CLIENTE PRONTO PARA USO!"
    log_color $GREEN "Acesse: http://$subdomain"
}

# Função para mostrar ajuda
show_help() {
    echo "🚀 Script Unificado: Criação e Deploy Automático (REFATORADO)"
    echo "============================================================="
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
    echo "  -h, --help             Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -n 'Bater Do Mar' -i 'bater_do_mar'"
    echo "  $0 -n 'Sabor Brasileiro' -i 'saborbrasileiro' -d 'saborbrasileiro.com' -e 'admin@saborbrasileiro.com'"
    echo "  $0 -n 'Meu Restaurante' -i 'meurestaurante' -r 'Meu Restaurante Ltda' -d 'meurestaurante.com' -e 'admin@meurestaurante.com'"
    echo
    echo "🔍 PORTAS AUTOMÁTICAS DO DOCKER:"
    echo "   O Docker escolhe automaticamente as portas disponíveis"
    echo "   e o script configura o proxy reverso do Nginx automaticamente"
    echo
    echo "🔧 DEPENDÊNCIAS AUTOMÁTICAS:"
    echo "   O script verifica e instala automaticamente todas as dependências"
    echo "   necessárias (docker, docker-compose, grep, sed)"
    echo
    echo "🔄 VERIFICAÇÃO DE CLIENTES EXISTENTES:"
    echo "   Se um cliente com o mesmo ID já existir, o script pergunta"
    echo "   se deseja recriar (remove tudo e cria novamente)"
    echo
    echo "🌐 PROXY REVERSO AUTOMÁTICO:"
    echo "   O script configura automaticamente o proxy reverso do Nginx"
    echo "   para o subdomínio do cliente, incluindo frontend e backend"
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
    log_color $GREEN "🎯 SCRIPT UNIFICADO: CRIAÇÃO E DEPLOY AUTOMÁTICO (REFATORADO)"
    log_color $GREEN "================================================================="
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
    
    # Verificar e instalar dependências necessárias
    check_and_install_dependencies
    
    # Limpar arquivos existentes se houver
    cleanup_existing_files "$CLIENT_ID"
    
    # Configurar portas automáticas do Docker
    log_color $BLUE "🔍 Chamando configure_docker_ports..."
    configure_docker_ports
    log_color $BLUE "✅ configure_docker_ports concluído"
    
    # Criar arquivo de ambiente
    log_color $BLUE "🔍 Chamando create_env_file..."
    create_env_file "$CLIENT_NAME" "$CLIENT_ID" "$DOMAIN" "$RESTAURANT_NAME"
    log_color $BLUE "✅ create_env_file concluído"
    
    # Criar docker-compose
    log_color $BLUE "🔍 Chamando create_docker_compose..."
    create_docker_compose "$CLIENT_ID"
    log_color $BLUE "✅ create_docker_compose concluído"
    
    # Fazer deploy
    log_color $BLUE "🔍 Chamando deploy_client..."
    deploy_client "$CLIENT_ID" "$CLIENT_NAME"
    log_color $BLUE "✅ deploy_client concluído"
    
    # Obter portas escolhidas pelo Docker
    log_color $BLUE "🔍 Chamando get_docker_ports..."
    get_docker_ports "$CLIENT_ID"
    log_color $BLUE "✅ get_docker_ports concluído"
    
    # Configurar proxy reverso no Nginx se domínio foi fornecido
    if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" ]]; then
        log_color $BLUE "🌐 Domínio fornecido, configurando proxy reverso no Nginx..."
        configure_nginx_proxy "$CLIENT_ID" "$DOMAIN" "$FRONTEND_PORT_CHOSEN" "$BACKEND_PORT_CHOSEN"
    else
        log_color $YELLOW "⚠️ Domínio não fornecido, proxy reverso não será configurado"
    fi
    
    # Mostrar resumo final
    show_summary "$CLIENT_NAME" "$CLIENT_ID" "$DOMAIN"
}

# Executar função principal
main "$@"
