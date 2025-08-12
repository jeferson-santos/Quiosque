#!/bin/bash
# ========================================
# SCRIPT PARA CONFIGURAR SSL COM CERTBOT
# ========================================
# Este script configura SSL/HTTPS para todos os subdomínios usando Let's Encrypt
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
    echo "🔒 Script para Configurar SSL com Certbot"
    echo "=========================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -s, --subdomains LIST      Lista de subdomínios separados por vírgula"
    echo "  -e, --email EMAIL          Email para notificações do Let's Encrypt"
    echo "  -t, --test                 Modo de teste (staging)"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com -s 'bater_do_mar,saborbrasileiro' -e 'admin@meudominio.com'"
    echo "  $0 -d meudominio.com -s 'rest1,rest2,rest3' -e 'admin@meudominio.com' -t"
    echo
}

# Função para verificar se Certbot está instalado
check_certbot() {
    log_color $BLUE "🔍 Verificando se Certbot está instalado..."
    
    if ! command -v certbot &> /dev/null; then
        log_color $RED "❌ Certbot não está instalado!"
        log_color $BLUE "📦 Instalando Certbot..."
        
        apt update
        apt install -y certbot python3-certbot-nginx
        
        log_color $GREEN "✅ Certbot instalado"
    else
        log_color $GREEN "✅ Certbot já está instalado"
    fi
}

# Função para configurar SSL para domínio principal
setup_main_domain_ssl() {
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
        return 1
    fi
}

# Função para configurar SSL para subdomínio admin
setup_admin_ssl() {
    local domain="$1"
    local email="$2"
    local test_mode="$3"
    
    log_color $BLUE "🔒 Configurando SSL para admin.${domain}"
    
    local certbot_cmd="certbot --nginx"
    
    if [ "$test_mode" = true ]; then
        certbot_cmd="$certbot_cmd --test-cert"
    fi
    
    # Configurar SSL para subdomínio admin
    if $certbot_cmd -d "admin.$domain" --email "$email" --agree-tos --non-interactive; then
        log_color $GREEN "✅ SSL configurado para admin.${domain}"
    else
        log_color $RED "❌ Erro ao configurar SSL para admin.${domain}"
        return 1
    fi
}

# Função para configurar SSL para subdomínios dos restaurantes
setup_restaurant_ssl() {
    local domain="$1"
    local subdomains="$2"
    local email="$3"
    local test_mode="$4"
    
    log_color $BLUE "🔒 Configurando SSL para subdomínios dos restaurantes..."
    
    local certbot_cmd="certbot --nginx"
    
    if [ "$test_mode" = true ]; then
        certbot_cmd="$certbot_cmd --test-cert"
    fi
    
    # Processar cada subdomínio
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)  # Remove espaços
        
        log_color $BLUE "🔒 Configurando SSL para ${subdomain}.${domain}"
        
        if $certbot_cmd -d "${subdomain}.$domain" --email "$email" --agree-tos --non-interactive; then
            log_color $GREEN "✅ SSL configurado para ${subdomain}.${domain}"
        else
            log_color $RED "❌ Erro ao configurar SSL para ${subdomain}.${domain}"
            # Continuar com outros subdomínios
        fi
    done
}

# Função para configurar renovação automática
setup_auto_renewal() {
    log_color $BLUE "🔄 Configurando renovação automática de certificados..."
    
    # Verificar se o cron job já existe
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_color $YELLOW "⚠️ Cron job para renovação já existe"
    else
        # Adicionar cron job para renovação automática
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --nginx") | crontab -
        log_color $GREEN "✅ Cron job para renovação automática configurado"
    fi
    
    # Testar renovação
    log_color $BLUE "🧪 Testando renovação automática..."
    if certbot renew --dry-run; then
        log_color $GREEN "✅ Teste de renovação bem-sucedido"
    else
        log_color $YELLOW "⚠️ Teste de renovação falhou (pode ser normal em ambiente de teste)"
    fi
}

# Função para verificar status dos certificados
check_certificates() {
    log_color $BLUE "📋 Verificando status dos certificados..."
    
    echo
    certbot certificates
    
    echo
    log_color $BLUE "📊 Resumo dos certificados:"
    
    # Listar todos os certificados
    certbot certificates | grep -E "Domains:|Expiry Date:" | while read -r line; do
        if [[ $line == *"Domains:"* ]]; then
            echo "   🌐 $line"
        elif [[ $line == *"Expiry Date:"* ]]; then
            echo "   📅 $line"
            echo
        fi
    done
}

# Função para configurar HSTS e segurança
setup_security_headers() {
    log_color $BLUE "🛡️ Configurando headers de segurança..."
    
    # Criar arquivo de configuração para headers de segurança
    cat > "/etc/nginx/conf.d/security-headers.conf" << 'EOF'
# Headers de segurança para todos os sites
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Remover versão do Nginx
server_tokens off;
EOF

    log_color $GREEN "✅ Headers de segurança configurados"
}

# Função para mostrar resumo final
show_summary() {
    local domain="$1"
    local subdomains="$2"
    local test_mode="$3"
    
    log_color $GREEN "🎉 CONFIGURAÇÃO SSL CONCLUÍDA!"
    log_color $GREEN "==============================="
    
    echo
    log_color $BLUE "🔒 CERTIFICADOS SSL CONFIGURADOS:"
    log_color $BLUE "   • Domínio principal: https://${domain}"
    log_color $BLUE "   • Admin: https://admin.${domain}"
    
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $BLUE "   • ${subdomain}: https://${subdomain}.${domain}"
    done
    
    echo
    log_color $BLUE "🛡️ RECURSOS DE SEGURANÇA:"
    log_color $BLUE "   • Headers de segurança configurados"
    log_color $BLUE "   • HSTS habilitado"
    log_color $BLUE "   • Renovação automática configurada"
    
    if [ "$test_mode" = true ]; then
        echo
        log_color $YELLOW "⚠️ MODO DE TESTE ATIVADO:"
        log_color $YELLOW "   • Certificados são de staging (não válidos para produção)"
        log_color $YELLOW "   • Execute novamente sem -t para certificados de produção"
    fi
    
    echo
    log_color $YELLOW "📋 PRÓXIMOS PASSOS:"
    log_color $YELLOW "1. Teste todos os subdomínios via HTTPS"
    log_color $YELLOW "2. Configure backup dos certificados"
    log_color $YELLOW "3. Monitore a renovação automática"
    log_color $YELLOW "4. Configure monitoramento de expiração"
    
    echo
    log_color $GREEN "🌐 URLs HTTPS:"
    log_color $GREEN "   • Admin: https://admin.${domain}"
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $GREEN "   • ${subdomain}: https://${subdomain}.${domain}"
    done
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
    local SUBDOMAINS=""
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
            -s|--subdomains)
                SUBDOMAINS="$2"
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
    
    if [[ -z "$SUBDOMAINS" ]]; then
        log_color $RED "❌ Subdomínios são obrigatórios (-s ou --subdomains)"
        exit 1
    fi
    
    if [[ -z "$EMAIL" ]]; then
        log_color $RED "❌ Email é obrigatório (-e ou --email)"
        exit 1
    fi
    
    # Verificar se é root
    if [ "$EUID" -ne 0 ]; then
        log_color $RED "❌ Este script deve ser executado como root!"
        log_color $RED "❌ Execute: sudo $0"
        exit 1
    fi
    
    # Mostrar resumo da configuração
    log_color $GREEN "🔒 CONFIGURAÇÃO SSL COM CERTBOT"
    log_color $GREEN "================================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Subdomínios: $SUBDOMAINS"
    log_color $BLUE "   Email: $EMAIL"
    log_color $BLUE "   Modo Teste: $TEST_MODE"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar configuração SSL? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Configuração cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando configuração SSL..."
    
    # Executar etapas
    check_certbot
    setup_main_domain_ssl "$DOMAIN" "$EMAIL" "$TEST_MODE"
    setup_admin_ssl "$DOMAIN" "$EMAIL" "$TEST_MODE"
    setup_restaurant_ssl "$DOMAIN" "$SUBDOMAINS" "$EMAIL" "$TEST_MODE"
    setup_security_headers
    setup_auto_renewal
    check_certificates
    show_summary "$DOMAIN" "$SUBDOMAINS" "$TEST_MODE"
}

# Executar função principal
main "$@"
