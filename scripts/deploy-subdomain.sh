#!/bin/bash
# ========================================
# SCRIPT PARA DEPLOY DE SUBDOMÍNIOS
# ========================================
# Este script configura um subdomínio para um restaurante
# Inclui: Nginx, SSL, e configuração do cliente
# DEVE ser executado como root

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para log colorido
log_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para mostrar ajuda
show_help() {
    echo "🏪 Script para Deploy de Subdomínios"
    echo "===================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -s, --subdomain SUBDOMAIN  Subdomínio (ex: bater_do_mar)"
    echo "  -p, --port PORT            Porta do frontend (padrão: 80)"
    echo "  -e, --email EMAIL          Email para notificações do Let's Encrypt"
    echo "  -t, --test                 Modo de teste para SSL (staging)"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com -s bater_do_mar -p 80 -e 'admin@meudominio.com'"
    echo "  $0 -d meudominio.com -s saborbrasileiro -p 8080 -e 'admin@meudominio.com' -t"
    echo
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log_color $BLUE "🔍 Verificando pré-requisitos..."
    
    # Verificar se é root
    if [ "$EUID" -ne 0 ]; then
        log_color $RED "❌ Este script deve ser executado como root!"
        log_color $RED "❌ Execute: sudo $0"
        exit 1
    fi
    
    # Verificar se Nginx está instalado
    if ! command -v nginx &> /dev/null; then
        log_color $RED "❌ Nginx não está instalado!"
        log_color $RED "❌ Execute primeiro o script setup-vps-complete.sh"
        exit 1
    fi
    
    # Verificar se Certbot está instalado
    if ! command -v certbot &> /dev/null; then
        log_color $RED "❌ Certbot não está instalado!"
        log_color $RED "❌ Execute primeiro o script setup-vps-complete.sh"
        exit 1
    fi
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        log_color $RED "❌ Docker não está instalado!"
        log_color $RED "❌ Execute primeiro o script setup-vps-complete.sh"
        exit 1
    fi
    
    log_color $GREEN "✅ Pré-requisitos verificados"
}

# Função para configurar Nginx para subdomínio
setup_nginx_subdomain() {
    local domain="$1"
    local subdomain="$2"
    local port="$3"
    
    log_color $BLUE "🌐 Configurando Nginx para ${subdomain}.${domain}..."
    
    local config_file="/etc/nginx/sites-available/${subdomain}.${domain}"
    
    # Criar configuração do Nginx para subdomínio
    cat > "$config_file" << EOF
# Configuração para ${subdomain}.${domain}
server {
    listen 80;
    server_name ${subdomain}.${domain};
    
    # Logs
    access_log /var/log/nginx/${subdomain}.${domain}.access.log;
    error_log /var/log/nginx/${subdomain}.${domain}.error.log;
    
    # Frontend (React)
    location / {
        proxy_pass http://localhost:${port};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Configurações para SPA
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API (FastAPI)
    location /api/ {
        # Calcular porta do backend (porta frontend + 8000)
        proxy_pass http://localhost:$((port + 8000));
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
        proxy_pass http://localhost:$((port + 8000));
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:$((port + 8000));
        proxy_set_header Host \$host;
    }
}
EOF

    # Habilitar site
    ln -sf "$config_file" "/etc/nginx/sites-enabled/"
    
    # Testar configuração
    if nginx -t; then
        systemctl reload nginx
        log_color $GREEN "✅ Nginx configurado para ${subdomain}.${domain}"
    else
        log_color $RED "❌ Erro na configuração do Nginx"
        exit 1
    fi
}

# Função para configurar SSL para subdomínio
setup_ssl_subdomain() {
    local domain="$1"
    local subdomain="$2"
    local email="$3"
    local test_mode="$4"
    
    log_color $BLUE "🔒 Configurando SSL para ${subdomain}.${domain}"
    
    local certbot_cmd="certbot --nginx"
    
    if [ "$test_mode" = true ]; then
        certbot_cmd="$certbot_cmd --test-cert"
        log_color $YELLOW "⚠️ Modo de teste ativado (staging)"
    fi
    
    # Configurar SSL para subdomínio
    if $certbot_cmd -d "${subdomain}.$domain" --email "$email" --agree-tos --non-interactive; then
        log_color $GREEN "✅ SSL configurado para ${subdomain}.${domain}"
    else
        log_color $RED "❌ Erro ao configurar SSL para ${subdomain}.${domain}"
        return 1
    fi
}

# Função para verificar se o cliente já existe
check_client_exists() {
    local subdomain="$1"
    local compose_file="docker-compose.${subdomain}.yml"
    
    if [ -f "$compose_file" ]; then
        log_color $YELLOW "⚠️ Cliente ${subdomain} já existe"
        return 0
    else
        log_color $RED "❌ Cliente ${subdomain} não encontrado!"
        log_color $RED "❌ Execute primeiro o script create-and-deploy.sh"
        return 1
    fi
}

# Função para verificar status do cliente
check_client_status() {
    local subdomain="$1"
    local compose_file="docker-compose.${subdomain}.yml"
    
    log_color $BLUE "📊 Verificando status do cliente ${subdomain}..."
    
    if [ -f "$compose_file" ]; then
        # Verificar se os containers estão rodando
        if docker compose -f "$compose_file" ps | grep -q "Up"; then
            log_color $GREEN "✅ Cliente ${subdomain} está rodando"
            return 0
        else
            log_color $YELLOW "⚠️ Cliente ${subdomain} não está rodando"
            return 1
        fi
    else
        log_color $RED "❌ Arquivo docker-compose.${subdomain}.yml não encontrado"
        return 1
    fi
}

# Função para configurar variáveis de ambiente
configure_environment() {
    local domain="$1"
    local subdomain="$2"
    local port="$3"
    
    log_color $BLUE "⚙️ Configurando variáveis de ambiente para ${subdomain}..."
    
    # Verificar se o arquivo .env existe
    if [ -f ".env" ]; then
        # Atualizar configurações específicas do subdomínio
        sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://${subdomain}.${domain}|" .env
        sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://${subdomain}.${domain}|" .env
        
        log_color $GREEN "✅ Variáveis de ambiente configuradas"
    else
        log_color $YELLOW "⚠️ Arquivo .env não encontrado"
    fi
}

# Função para mostrar resumo final
show_summary() {
    local domain="$1"
    local subdomain="$2"
    local port="$3"
    local test_mode="$4"
    
    log_color $GREEN "🎉 DEPLOY DO SUBDOMÍNIO CONCLUÍDO!"
    log_color $GREEN "====================================="
    
    echo
    log_color $BLUE "📋 RESUMO DO DEPLOY:"
    log_color $BLUE "   ✅ Subdomínio configurado: ${subdomain}.${domain}"
    log_color $BLUE "   ✅ Nginx configurado e habilitado"
    log_color $BLUE "   ✅ SSL/HTTPS configurado"
    log_color $BLUE "   ✅ Cliente verificado e configurado"
    
    echo
    log_color $BLUE "🌐 URLs DE ACESSO:"
    log_color $BLUE "   • Frontend: https://${subdomain}.${domain}"
    log_color $BLUE "   • API: https://${subdomain}.${domain}/api/"
    log_color $BLUE "   • Documentação: https://${subdomain}.${domain}/docs"
    
    echo
    log_color $BLUE "🔧 CONFIGURAÇÕES:"
    log_color $BLUE "   • Porta Frontend: ${port}"
    log_color $BLUE "   • Porta Backend: $((port + 8000))"
    log_color $BLUE "   • Porta PostgreSQL: $((port + 5432))"
    log_color $BLUE "   • Porta Redis: $((port + 6379))"
    
    if [ "$test_mode" = true ]; then
        echo
        log_color $YELLOW "⚠️ MODO DE TESTE ATIVADO:"
        log_color $YELLOW "   • Certificado SSL é de staging (não válido para produção)"
        log_color $YELLOW "   • Execute novamente sem -t para certificado de produção"
    fi
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • Configure o registro DNS para ${subdomain}.${domain}"
    log_color $YELLOW "   • Teste o acesso via HTTPS"
    log_color $YELLOW "   • Monitore os logs em /var/log/nginx/"
    
    echo
    log_color $GREEN "🎯 SUBDOMÍNIO PRONTO PARA USO!"
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
    local SUBDOMAIN=""
    local PORT="80"
    local EMAIL=""
    local TEST_MODE=false
    
    # Verificar se há argumentos
    if [[ $# -eq 0 ]]; then
        show_help
        exit 1
    fi
    
    # Processar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -s|--subdomain)
                SUBDOMAIN="$2"
                shift 2
                ;;
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            -t|--test)
                TEST_MODE=true
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
    if [[ -z "$DOMAIN" ]]; then
        log_color $RED "❌ Domínio é obrigatório (-d ou --domain)"
        exit 1
    fi
    
    if [[ -z "$SUBDOMAIN" ]]; then
        log_color $RED "❌ Subdomínio é obrigatório (-s ou --subdomain)"
        exit 1
    fi
    
    if [[ -z "$EMAIL" ]]; then
        log_color $RED "❌ Email é obrigatório (-e ou --email)"
        exit 1
    fi
    
    # Mostrar resumo da configuração
    log_color $GREEN "🏪 DEPLOY DE SUBDOMÍNIO"
    log_color $GREEN "======================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Subdomínio: $SUBDOMAIN"
    log_color $BLUE "   Porta: $PORT"
    log_color $BLUE "   Email: $EMAIL"
    log_color $BLUE "   Modo Teste: $TEST_MODE"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar deploy do subdomínio? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Deploy cancelado pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando deploy do subdomínio..."
    
    # Executar etapas
    check_prerequisites
    check_client_exists "$SUBDOMAIN"
    check_client_status "$SUBDOMAIN"
    setup_nginx_subdomain "$DOMAIN" "$SUBDOMAIN" "$PORT"
    setup_ssl_subdomain "$DOMAIN" "$SUBDOMAIN" "$EMAIL" "$TEST_MODE"
    configure_environment "$DOMAIN" "$SUBDOMAIN" "$PORT"
    show_summary "$DOMAIN" "$SUBDOMAIN" "$PORT" "$TEST_MODE"
}

# Executar função principal
main "$@"
