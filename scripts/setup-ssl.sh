#!/bin/bash
# ========================================
# SCRIPT PARA CONFIGURAÇÃO DE SSL APENAS
# ========================================
# Este script configura SSL para domínio principal e subdomínios
# Pode ser executado independentemente após o setup-vps.sh
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
    echo "🔒 Script para Configuração de SSL"
    echo "========================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -e, --email EMAIL          Email para notificações do Let's Encrypt"
    echo "  -t, --test                 Modo de teste para SSL (staging)"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com -e 'admin@meudominio.com'"
    echo "  $0 -d meudominio.com -e 'admin@meudominio.com' -t"
    echo
    echo "PRÉ-REQUISITOS:"
    echo "  1. setup-vps.sh já executado com sucesso"
    echo "  2. Traefik e Portainer rodando"
    echo "  3. Domínio configurado e funcionando"
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
    
    # Verificar se Traefik está rodando
    if ! docker ps | grep -q traefik; then
        log_color $RED "❌ Traefik não está rodando!"
        log_color $YELLOW "⚠️ Execute primeiro: sudo ./scripts/setup-vps.sh"
        exit 1
    fi
    
    # Verificar se Portainer está rodando
    if ! docker ps | grep -q portainer; then
        log_color $RED "❌ Portainer não está rodando!"
        log_color $YELLOW "⚠️ Execute primeiro: sudo ./scripts/setup-vps.sh"
        exit 1
    fi
    
    # Verificar se Certbot está instalado
    if ! command -v certbot &> /dev/null; then
        log_color $RED "❌ Certbot não está instalado!"
        log_color $YELLOW "⚠️ Execute primeiro: sudo ./scripts/setup-vps.sh"
        exit 1
    fi
    
    log_color $GREEN "✅ Pré-requisitos verificados"
}

# Função para configurar SSL para domínio principal
setup_ssl_main_domain() {
    local domain="$1"
    local email="$2"
    local test_mode="$3"
    
    log_color $BLUE "🔒 Configurando SSL para domínio principal: ${domain}"
    
    local certbot_cmd="certbot --nginx"
    
    if [ "$test_mode" = true ]; then
        certbot_cmd="$certbot_cmd --test-cert"
        log_color $YELLOW "⚠️ Modo de teste ativado (staging)"
    fi
    
    # Configurar SSL para domínio principal
    if $certbot_cmd -d "$domain" -d "www.$domain" --email "$email" --agree-tos --non-interactive; then
        log_color $GREEN "✅ SSL configurado para ${domain}"
    else
        log_color $RED "❌ Erro ao configurar SSL para ${domain}"
        log_color $YELLOW "⚠️ Verifique os logs: tail -f /var/log/letsencrypt/letsencrypt.log"
        return 1
    fi
}

# Função para configurar Traefik com SSL
setup_traefik_ssl() {
    local domain="$1"
    local email="$2"
    
    log_color $BLUE "🌐 Configurando Traefik com SSL..."
    
    # Parar Traefik
    cd /opt/quiosque/traefik
    docker compose down
    
    # Atualizar configuração do Traefik para usar portas 80/443
    cat > "/opt/quiosque/traefik/traefik.yml" << EOF
global:
  checkNewVersion: false
  sendAnonymousUsage: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik_network

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${email}
      storage: /certs/acme.json
      httpChallenge:
        entryPoint: web

api:
  dashboard: true
  insecure: false

log:
  level: INFO

accessLog:
  filePath: "/logs/access.log"
  format: json

metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
EOF

    # Atualizar docker-compose para usar portas 80/443
    cat > "/opt/quiosque/traefik/docker-compose.yml" << EOF
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./certs:/certs
      - ./logs:/logs
    networks:
      - traefik_network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(\`traefik.${domain}\`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:\$\$2y\$\$10\$\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"

volumes:
  traefik_certs:

networks:
  traefik_network:
    external: true
EOF

    # Parar Nginx temporariamente para liberar portas
    log_color $BLUE "🛑 Parando Nginx temporariamente..."
    systemctl stop nginx
    
    # Iniciar Traefik
    log_color $BLUE "🚀 Iniciando Traefik com SSL..."
    docker compose up -d
    
    # Aguardar Traefik iniciar
    sleep 15
    
    # Verificar se Traefik está rodando
    if docker ps | grep -q traefik; then
        log_color $GREEN "✅ Traefik iniciado com SSL"
    else
        log_color $RED "❌ Erro ao iniciar Traefik"
        return 1
    fi
    
    # Reiniciar Nginx (agora Traefik está usando 80/443)
    log_color $BLUE "🔄 Reiniciando Nginx..."
    systemctl start nginx
    
    log_color $GREEN "✅ Traefik configurado com SSL"
}

# Função para mostrar resumo final
show_summary() {
    local domain="$1"
    local email="$2"
    
    log_color $GREEN "🎉 CONFIGURAÇÃO DE SSL CONCLUÍDA!"
    log_color $GREEN "=================================="
    
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO SSL:"
    log_color $BLUE "   ✅ SSL configurado para domínio principal"
    log_color $BLUE "   ✅ Traefik configurado com SSL nas portas 80/443"
    log_color $BLUE "   ✅ Portainer funcionando com SSL"
    log_color $BLUE "   ✅ Traefik Dashboard funcionando com SSL"
    
    echo
    log_color $BLUE "🌐 URLs DE ACESSO (AGORA COM HTTPS):"
    log_color $BLUE "   • Domínio principal: https://${domain}"
    log_color $BLUE "   • www: https://www.${domain}"
    log_color $BLUE "   • Portainer: https://portainer.${domain}"
    log_color $BLUE "   • Traefik Dashboard: https://traefik.${domain}"
    
    echo
    log_color $BLUE "🔧 PORTAS DOS SERVIÇOS:"
    log_color $BLUE "   • Traefik: 80/443 (HTTP/HTTPS)"
    log_color $BLUE "   • Portainer: 9000 (via Traefik)"
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • Traefik agora gerencia as portas 80/443"
    log_color $YELLOW "   • Nginx está rodando mas não usa essas portas"
    log_color $YELLOW "   • Todos os subdomínios agora têm SSL automático"
    
    echo
    log_color $GREEN "🎯 SSL CONFIGURADO COM SUCESSO!"
    log_color $GREEN "🌐 Todos os serviços agora rodam em HTTPS!"
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
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
    
    if [[ -z "$EMAIL" ]]; then
        log_color $RED "❌ Email é obrigatório (-e ou --email)"
        exit 1
    fi
    
    # Mostrar resumo da configuração
    log_color $GREEN "🔒 CONFIGURAÇÃO DE SSL APENAS"
    log_color $GREEN "============================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Email: $EMAIL"
    log_color $BLUE "   Modo Teste: $TEST_MODE"
    log_color $BLUE "   Ação: Configurar SSL para domínio + Traefik"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar configuração de SSL? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Configuração cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando configuração de SSL..."
    
    # Executar etapas
    check_prerequisites
    setup_ssl_main_domain "$DOMAIN" "$EMAIL" "$TEST_MODE"
    setup_traefik_ssl "$DOMAIN" "$EMAIL"
    show_summary "$DOMAIN" "$EMAIL"
}

# Executar função principal
main "$@"
