#!/bin/bash
# ========================================
# SCRIPT COMPLETO PARA DEPLOY DA VPS COM SUBDOMÍNIOS
# ========================================
# Este script automatiza todo o processo de deploy em VPS Ubuntu
# Inclui: Docker, Nginx, SSL, e configuração de subdomínios
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
    echo "🚀 Script Completo para Deploy da VPS com Subdomínios"
    echo "====================================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -s, --subdomains LIST      Lista de subdomínios separados por vírgula"
    echo "  -e, --email EMAIL          Email para notificações do Let's Encrypt"
    echo "  -p, --ports LIST           Listas de portas separadas por vírgula"
    echo "  -t, --test                 Modo de teste para SSL (staging)"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com -s 'bater_do_mar,saborbrasileiro' -e 'admin@meudominio.com'"
    echo "  $0 -d meudominio.com -s 'rest1,rest2,rest3' -e 'admin@meudominio.com' -p '80,8080,8081'"
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
    
    # Verificar sistema operacional
    if ! lsb_release -d 2>/dev/null | grep -q "Ubuntu"; then
        log_color $RED "❌ Este script é específico para Ubuntu!"
        exit 1
    fi
    
    # Verificar conectividade com internet
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        log_color $RED "❌ Sem conectividade com internet!"
        exit 1
    fi
    
    log_color $GREEN "✅ Pré-requisitos verificados"
}

# Função para executar deploy básico da VPS
run_basic_deploy() {
    log_color $BLUE "🚀 Executando deploy básico da VPS..."
    
    # Executar script de deploy básico
    if [ -f "./deploy-vps.sh" ]; then
        log_color $BLUE "📥 Executando deploy-vps.sh..."
        ./deploy-vps.sh
    else
        log_color $RED "❌ Script deploy-vps.sh não encontrado!"
        log_color $BLUE "📥 Baixando do repositório..."
        
        # Clonar repositório se não existir
        if [ ! -d "Quiosque" ]; then
            git clone https://github.com/jeferson-santos/Quiosque.git
        fi
        
        cd Quiosque
        chmod +x scripts/deploy-vps.sh
        ./scripts/deploy-vps.sh
    fi
    
    log_color $GREEN "✅ Deploy básico da VPS concluído"
}

# Função para configurar Nginx com subdomínios
setup_nginx_subdomains() {
    local domain="$1"
    local subdomains="$2"
    local ports="$3"
    
    log_color $BLUE "🌐 Configurando Nginx com subdomínios..."
    
    # Executar script de configuração do Nginx
    if [ -f "./setup-nginx-subdomains.sh" ]; then
        ./setup-nginx-subdomains.sh -d "$domain" -s "$subdomains" -p "$ports"
    else
        log_color $RED "❌ Script setup-nginx-subdomains.sh não encontrado!"
        exit 1
    fi
    
    log_color $GREEN "✅ Nginx configurado com subdomínios"
}

# Função para configurar SSL
setup_ssl() {
    local domain="$1"
    local subdomains="$2"
    local email="$3"
    local test_mode="$4"
    
    log_color $BLUE "🔒 Configurando SSL com Certbot..."
    
    # Executar script de configuração SSL
    if [ -f "./setup-ssl.sh" ]; then
        local ssl_cmd="./setup-ssl.sh -d '$domain' -s '$subdomains' -e '$email'"
        
        if [ "$test_mode" = true ]; then
            ssl_cmd="$ssl_cmd -t"
        fi
        
        eval "$ssl_cmd"
    else
        log_color $RED "❌ Script setup-ssl.sh não encontrado!"
        exit 1
    fi
    
    log_color $GREEN "✅ SSL configurado"
}

# Função para criar clientes
create_clients() {
    local domain="$1"
    local subdomains="$2"
    local ports="$3"
    
    log_color $BLUE "🏪 Criando clientes para os restaurantes..."
    
    # Verificar se estamos no diretório correto
    if [ ! -f "create-and-deploy.sh" ]; then
        log_color $RED "❌ Script create-and-deploy.sh não encontrado!"
        log_color $BLUE "📁 Mudando para diretório Quiosque..."
        cd Quiosque
    fi
    
    # Tornar script executável
    chmod +x create-and-deploy.sh
    
    # Processar cada subdomínio
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    IFS=',' read -ra PORT_ARRAY <<< "$ports"
    
    for i in "${!SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "${SUBDOMAIN_ARRAY[$i]}" | xargs)
        port="${PORT_ARRAY[$i]:-80}"
        
        log_color $BLUE "🏪 Criando cliente: ${subdomain}"
        
        # Criar cliente usando o script unificado
        ./create-and-deploy.sh -n "${subdomain^}" -i "$subdomain" -d "${subdomain}.${domain}"
        
        # Configurar portas específicas no .env
        if [ -f ".env" ]; then
            sed -i "s/BACKEND_PORT=.*/BACKEND_PORT=$((port + 8000))/" .env
            sed -i "s/FRONTEND_PORT=.*/FRONTEND_PORT=$port/" .env
            sed -i "s/POSTGRES_PORT=.*/POSTGRES_PORT=$((port + 5432))/" .env
            sed -i "s/REDIS_PORT=.*/REDIS_PORT=$((port + 6379))/" .env
            
            # Configurar URLs para HTTPS
            sed -i "s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://${subdomain}.${domain}|" .env
            sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://${subdomain}.${domain}|" .env
            
            log_color $GREEN "✅ Cliente ${subdomain} criado e configurado"
        fi
    done
}

# Função para configurar backup automático
setup_backup() {
    log_color $BLUE "💾 Configurando backup automático..."
    
    # Criar diretório de backup
    mkdir -p /opt/quiosque/backups
    
    # Criar script de backup
    cat > "/opt/quiosque/backup.sh" << 'EOF'
#!/bin/bash
# Script de backup automático para Sistema de Quiosque

BACKUP_DIR="/opt/quiosque/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="quiosque_backup_$DATE"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Backup dos containers Docker
cd /opt/quiosque/Quiosque
docker-compose -f docker-compose.*.yml ps -q | while read container; do
    docker commit "$container" "backup_$container:$DATE"
done

# Backup dos volumes Docker
docker run --rm -v quiosque_postgres_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v quiosque_redis_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .

# Backup dos arquivos de configuração
cp -r /opt/quiosque/Quiosque/.env* "$BACKUP_DIR/$BACKUP_NAME/"
cp -r /opt/quiosque/Quiosque/docker-compose.*.yml "$BACKUP_DIR/$BACKUP_NAME/"

# Backup dos certificados SSL
cp -r /etc/letsencrypt "$BACKUP_DIR/$BACKUP_NAME/"

# Backup das configurações do Nginx
cp -r /etc/nginx/sites-available "$BACKUP_DIR/$BACKUP_NAME/"
cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/$BACKUP_NAME/"

# Comprimir backup
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Manter apenas os últimos 7 backups
ls -t *.tar.gz | tail -n +8 | xargs -r rm

echo "Backup concluído: ${BACKUP_NAME}.tar.gz"
EOF

    # Tornar executável
    chmod +x /opt/quiosque/backup.sh
    
    # Configurar cron job para backup diário às 2h da manhã
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/quiosque/backup.sh >> /var/log/quiosque_backup.log 2>&1") | crontab -
    
    log_color $GREEN "✅ Backup automático configurado"
}

# Função para configurar monitoramento
setup_monitoring() {
    log_color $BLUE "📊 Configurando monitoramento básico..."
    
    # Criar script de monitoramento
    cat > "/opt/quiosque/monitor.sh" << 'EOF'
#!/bin/bash
# Script de monitoramento para Sistema de Quiosque

LOG_FILE="/var/log/quiosque_monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Iniciando verificação de status..." >> "$LOG_FILE"

# Verificar status dos containers
cd /opt/quiosque/Quiosque
docker-compose -f docker-compose.*.yml ps >> "$LOG_FILE" 2>&1

# Verificar uso de disco
df -h >> "$LOG_FILE" 2>&1

# Verificar uso de memória
free -h >> "$LOG_FILE" 2>&1

# Verificar status dos serviços
systemctl status nginx --no-pager >> "$LOG_FILE" 2>&1
systemctl status docker --no-pager >> "$LOG_FILE" 2>&1

# Verificar certificados SSL
certbot certificates >> "$LOG_FILE" 2>&1

echo "[$DATE] Verificação concluída" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
EOF

    # Tornar executável
    chmod +x /opt/quiosque/monitor.sh
    
    # Configurar cron job para monitoramento a cada 5 minutos
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/quiosque/monitor.sh") | crontab -
    
    # Configurar rotação de logs
    cat > "/etc/logrotate.d/quiosque" << 'EOF'
/var/log/quiosque_*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

    log_color $GREEN "✅ Monitoramento configurado"
}

# Função para mostrar resumo final
show_final_summary() {
    local domain="$1"
    local subdomains="$2"
    local email="$3"
    
    log_color $GREEN "🎉 DEPLOY COMPLETO DA VPS CONCLUÍDO!"
    log_color $GREEN "====================================="
    
    echo
    log_color $BLUE "📋 RESUMO DO DEPLOY:"
    log_color $BLUE "   ✅ VPS Ubuntu configurada"
    log_color $BLUE "   ✅ Docker e Docker Compose instalados"
    log_color $BLUE "   ✅ Nginx configurado com subdomínios"
    log_color $BLUE "   ✅ SSL/HTTPS configurado com Let's Encrypt"
    log_color $BLUE "   ✅ Clientes criados e configurados"
    log_color $BLUE "   ✅ Backup automático configurado"
    log_color $BLUE "   ✅ Monitoramento configurado"
    
    echo
    log_color $BLUE "🌐 URLs DE ACESSO:"
    log_color $BLUE "   • Admin: https://admin.${domain}"
    
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $BLUE "   • ${subdomain}: https://${subdomain}.${domain}"
    done
    
    echo
    log_color $BLUE "🔧 COMANDOS ÚTEIS:"
    log_color $BLUE "   • Ver status: docker ps"
    log_color $BLUE "   • Ver logs: docker logs <container>"
    log_color $BLUE "   • Backup manual: /opt/quiosque/backup.sh"
    log_color $BLUE "   • Monitoramento: /opt/quiosque/monitor.sh"
    log_color $BLUE "   • Ver certificados: certbot certificates"
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • Configure os registros DNS para apontar para esta VPS"
    log_color $YELLOW "   • Teste todos os subdomínios via HTTPS"
    log_color $YELLOW "   • Monitore os logs em /var/log/quiosque_*.log"
    log_color $YELLOW "   • Backup automático executado diariamente às 2h"
    log_color $YELLOW "   • Monitoramento executado a cada 5 minutos"
    
    echo
    log_color $GREEN "📚 DOCUMENTAÇÃO:"
    log_color $GREEN "   • README.md - Guia completo do projeto"
    log_color $GREEN "   • Scripts na pasta scripts/"
    
    echo
    log_color $GREEN "🎯 SISTEMA PRONTO PARA PRODUÇÃO!"
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
    local SUBDOMAINS=""
    local EMAIL=""
    local PORTS=""
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
            -p|--ports)
                PORTS="$2"
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
    
    # Definir portas padrão se não fornecidas
    if [[ -z "$PORTS" ]]; then
        PORTS="80,8080,8081,8082,8083"
        log_color $YELLOW "⚠️ Portas padrão definidas: $PORTS"
    fi
    
    # Mostrar resumo da configuração
    log_color $GREEN "🚀 DEPLOY COMPLETO DA VPS COM SUBDOMÍNIOS"
    log_color $GREEN "=========================================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Subdomínios: $SUBDOMAINS"
    log_color $BLUE "   Email: $EMAIL"
    log_color $BLUE "   Portas: $PORTS"
    log_color $BLUE "   Modo Teste: $TEST_MODE"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar deploy completo da VPS? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Deploy cancelado pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando deploy completo da VPS..."
    
    # Executar etapas
    check_prerequisites
    run_basic_deploy
    setup_nginx_subdomains "$DOMAIN" "$SUBDOMAINS" "$PORTS"
    setup_ssl "$DOMAIN" "$SUBDOMAINS" "$EMAIL" "$TEST_MODE"
    create_clients "$DOMAIN" "$SUBDOMAINS" "$PORTS"
    setup_backup
    setup_monitoring
    show_final_summary "$DOMAIN" "$SUBDOMAINS" "$EMAIL"
}

# Executar função principal
main "$@"
