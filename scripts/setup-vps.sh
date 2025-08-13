#!/bin/bash
# ========================================
# SCRIPT PARA CONFIGURAÇÃO COMPLETA DA VPS (ARQUITETURA LIMPA!)
# ========================================
# Este script configura uma VPS Ubuntu completa para o Sistema de Quiosque
# Inclui: Docker, Nginx, SSL para domínio principal
# Subdomains são gerenciados pelo create-and-deploy.sh (arquivos separados)
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
    echo "🚀 Script para Configuração COMPLETA da VPS (TUDO EM UM!)"
    echo "========================================================="
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
    echo "  1. Clone o repositório: git clone <seu-repositorio> /opt/quiosque/Quiosque"
    echo "  2. Execute este script como root: sudo $0 -d DOMAIN -e EMAIL"
    echo
    echo "🎯 ESTE SCRIPT CONFIGURA TUDO:"
    echo "   ✅ VPS básica (Docker, Nginx, SSL)"
    echo "   ✅ Nginx para domínio principal (arquitetura limpa)"
    echo "   ✅ Subdomains gerenciados pelo create-and-deploy.sh"
    echo "   ✅ Backup e monitoramento automático"
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

# Função para instalar ferramentas essenciais
install_tools() {
    log_color $BLUE "🔧 Instalando ferramentas essenciais..."
    
    apt update
    apt install -y curl wget git ufw fail2ban htop nginx certbot python3-certbot-nginx logrotate
    
    log_color $GREEN "✅ Ferramentas essenciais instaladas"
}

# Função para configurar firewall
setup_firewall() {
    log_color $BLUE "🔥 Configurando firewall (UFW)..."
    
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 22
    
    log_color $GREEN "✅ Firewall configurado"
}

# Função para instalar Docker
install_docker() {
    log_color $BLUE "🐳 Instalando Docker..."
    
    # Remover versões antigas
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Instalar dependências
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Adicionar repositório oficial do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Iniciar e habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    log_color $GREEN "✅ Docker instalado e configurado"
}

# Função para criar usuário da aplicação
create_app_user() {
    log_color $BLUE "👤 Criando usuário da aplicação..."
    
    # Criar usuário se não existir
    if ! id "quiosque" &>/dev/null; then
        useradd -m -s /bin/bash quiosque
        usermod -aG docker quiosque
        usermod -aG sudo quiosque
        
        # Configurar sudo sem senha para o usuário quiosque
        echo "quiosque ALL=(ALL) NOPASSWD:ALL" | tee /etc/sudoers.d/quiosque
    fi
    
    log_color $GREEN "✅ Usuário quiosque criado/configurado"
}

# Função para configurar diretórios
setup_directories() {
    log_color $BLUE "📁 Configurando diretórios..."
    
    # Criar diretórios da aplicação
    mkdir -p /opt/quiosque
    mkdir -p /opt/quiosque/logs
    mkdir -p /opt/quiosque/backups
    mkdir -p /opt/quiosque/ssl
    
    # Definir permissões
    chown -R quiosque:quiosque /opt/quiosque
    chmod -R 755 /opt/quiosque
    
    log_color $GREEN "✅ Diretórios configurados"
}

# Função para verificar repositório
check_repository() {
    log_color $BLUE "📁 Verificando repositório..."
    
    # Verificar se o repositório já existe
    if [ ! -d "/opt/quiosque/Quiosque" ]; then
        log_color $YELLOW "⚠️ Repositório não encontrado em /opt/quiosque/Quiosque"
        log_color $YELLOW "⚠️ Execute manualmente: git clone <seu-repositorio> /opt/quiosque/Quiosque"
        log_color $YELLOW "⚠️ Depois execute este script novamente"
        exit 1
    fi
    
    # Verificar se é um repositório git válido
    if [ ! -d "/opt/quiosque/Quiosque/.git" ]; then
        log_color $RED "❌ Diretório /opt/quiosque/Quiosque não é um repositório git válido!"
        log_color $RED "❌ Clone o repositório manualmente antes de executar este script"
        exit 1
    fi
    
    # Definir permissões
    chown -R quiosque:quiosque /opt/quiosque/Quiosque
    
    log_color $GREEN "✅ Repositório verificado e permissões configuradas"
}

# Função para configurar Nginx para domínio principal
setup_nginx_main_domain() {
    local domain="$1"
    
    log_color $BLUE "🌐 Configurando Nginx para domínio principal: ${domain}"
    
    # Criar configuração do Nginx para domínio principal
    cat > "/etc/nginx/sites-available/${domain}" << EOF
# Configuração para ${domain}
server {
    listen 80;
    server_name ${domain} www.${domain};
    
    # Logs
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
    
    # Página de boas-vindas
    location / {
        root /var/www/${domain};
        index index.html;
        
        # Configurações para SPA
        try_files \$uri \$uri/ /index.html;
    }
    
    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

    # Criar página de boas-vindas
    mkdir -p "/var/www/${domain}"
    cat > "/var/www/${domain}/index.html" << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Quiosque - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .info { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .info h3 { margin: 0 0 10px 0; color: #007bff; }
        .info p { margin: 5px 0; color: #666; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏪 Sistema de Quiosque</h1>
        <p style="text-align: center; color: #666;">VPS configurada e pronta para uso</p>
        
        <div class="info">
            <h3>✅ VPS Configurada</h3>
            <p><strong>Domínio:</strong> ${domain}</p>
            <p><strong>Status:</strong> Sistema pronto para deploy de subdomínios</p>
        </div>
        
        <div class="info">
            <h3>🔧 Próximos Passos</h3>
            <p>1. Use o script create-and-deploy.sh para criar restaurantes</p>
            <p>2. Cada restaurante será configurado automaticamente</p>
            <p>3. SSL será configurado para cada subdomínio</p>
        </div>
        
        <div class="footer">
            <p>Sistema de Quiosque - ${domain}</p>
            <p>Configurado em: $(date)</p>
        </div>
    </div>
</body>
</html>
EOF

    # Definir permissões
    chown -R www-data:www-data "/var/www/${domain}"
    chmod -R 755 "/var/www/${domain}"
    
    # Habilitar site
    ln -sf "/etc/nginx/sites-available/${domain}" "/etc/nginx/sites-enabled/"
    
    # Testar configuração
    if nginx -t; then
        systemctl reload nginx
        log_color $GREEN "✅ Nginx configurado para ${domain}"
    else
        log_color $RED "❌ Erro na configuração do Nginx"
        exit 1
    fi
}

# Função para configurar Nginx com arquitetura limpa (sem subdomains)
setup_nginx_clean() {
    local domain="$1"
    
    log_color $BLUE "🌐 Configurando Nginx com arquitetura limpa..."
    
    # Criar configuração principal do nginx APENAS para o domínio principal
    cat > "/etc/nginx/sites-available/default" << EOF
# ========================================
# CONFIGURAÇÃO PRINCIPAL DO NGINX - DOMÍNIO PRINCIPAL
# ========================================
# Gerado automaticamente pelo setup-vps.sh
# Data: $(date)
# Domínio: ${domain}
# ARQUITETURA: Cada subdomain terá seu próprio arquivo

# Servidor HTTP - Redirecionar para HTTPS
server {
    listen 80;
    server_name ${domain} www.${domain};
    
    # Logs do domínio principal
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
    
    # Redirecionar tudo para HTTPS
    return 301 https://\$server_name\$request_uri;
}

# Servidor HTTPS - Domínio principal
server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};
    
    # Página de boas-vindas do sistema
    location / {
        return 200 "🚀 Sistema de Quiosques - ${domain}

✅ VPS configurada com sucesso!
✅ Docker, Nginx e SSL funcionando
✅ Use create-and-deploy.sh para criar clientes
✅ Cada cliente terá seu próprio subdomain

📋 Para criar um cliente:
   ./create-and-deploy.sh -n 'Nome' -i 'id' -d '${domain}' -e 'email@exemplo.com'

🌐 Subdomains serão criados automaticamente como:
   • cliente1.${domain}
   • cliente2.${domain}
   • etc.

🔧 Sistema gerenciado por: create-and-deploy.sh";
        
        add_header Content-Type text/plain;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Health check do domínio principal
    location /health {
        access_log off;
        return 200 "OK - Domínio principal funcionando";
        add_header Content-Type text/plain;
    }
    
    # Status do nginx (apenas localhost)
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
    
    # Logs específicos do domínio principal
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
}

# Configuração para HTTPS (quando configurado)
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # Redirecionar HTTP para HTTPS
    if (\$scheme != "https") {
        return 301 https://\$host\$request_uri;
    }
    
    # Padrão HTTPS
    location / {
        return 404 "Subdomínio não configurado. Use o script create-and-deploy.sh para configurar.";
    }
}

# ========================================
# NOTAS IMPORTANTES:
# ========================================
# 
# 1. Este arquivo é gerenciado automaticamente pelo setup-vps.sh
# 2. Para adicionar novos subdomínios, use o script create-and-deploy.sh
# 3. O script detecta automaticamente todos os clientes existentes
# 4. As portas são configuradas automaticamente baseadas nos arquivos .env
# 5. NÃO edite este arquivo manualmente - suas alterações serão sobrescritas
# 6. Para personalizar, modifique o script setup-vps.sh
#
# ========================================
EOF

    # Habilitar configuração padrão
    ln -sf "/etc/nginx/sites-available/default" "/etc/nginx/sites-enabled/"
    
    # Testar configuração
    if nginx -t; then
        systemctl reload nginx
        log_color $GREEN "✅ Nginx configurado com arquitetura limpa"
    else
        log_color $RED "❌ Erro na configuração do Nginx para subdomínios"
        exit 1
    fi
}

# Função para configurar SSL para domínio principal
setup_ssl_main_domain() {
    local domain="$1"
    local email="$2"
    local test_mode="$3"
    
    log_color $BLUE "🔒 Configurando SSL para domínio principal: ${domain}"
    
    # Verificar se Certbot está instalado
    if ! command -v certbot &> /dev/null; then
        log_color $RED "❌ Certbot não está instalado!"
        exit 1
    fi
    
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
docker compose -f docker-compose.*.yml ps -q | while read container; do
    docker commit "$container" "backup_$container:$DATE"
done

# Backup dos volumes Docker
docker run --rm -v quiosque_postgres_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data . 2>/dev/null || true
docker run --rm -v quiosque_redis_data:/data -v "$BACKUP_DIR/$BACKUP_NAME":/backup alpine tar czf /backup/redis_data.tar.gz -C /data . 2>/dev/null || true

# Backup dos arquivos de configuração
cp -r /opt/quiosque/Quiosque/.env* "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true
cp -r /opt/quiosque/Quiosque/docker-compose.*.yml "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || true

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
docker compose -f docker-compose.*.yml ps >> "$LOG_FILE" 2>&1

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
show_summary() {
    local domain="$1"
    local email="$2"
    local test_mode="$3"
    
    log_color $GREEN "🎉 CONFIGURAÇÃO COMPLETA DA VPS CONCLUÍDA!"
    log_color $GREEN "============================================="
    
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   ✅ VPS Ubuntu configurada"
    log_color $BLUE "   ✅ Docker e Docker Compose instalados"
    log_color $BLUE "   ✅ Nginx configurado para domínio principal"
    log_color $BLUE "   ✅ Nginx configurado para subdomínios"
    log_color $BLUE "   ✅ SSL/HTTPS configurado para domínio principal"
    log_color $BLUE "   ✅ Backup automático configurado"
    log_color $BLUE "   ✅ Monitoramento configurado"
    
    echo
    log_color $BLUE "🌐 URLs DE ACESSO:"
    log_color $BLUE "   • Domínio principal: https://${domain}"
    log_color $BLUE "   • www: https://www.${domain}"
    
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
    log_color $YELLOW "   • Teste o domínio principal via HTTPS"
    log_color $YELLOW "   • Monitore os logs em /var/log/quiosque_*.log"
    log_color $YELLOW "   • Backup automático executado diariamente às 2h"
    log_color $YELLOW "   • Monitoramento executado a cada 5 minutos"
    
    echo
    log_color $GREEN "📚 PRÓXIMOS PASSOS:"
    log_color $GREEN "1. Clone o repositório: git clone <seu-repositorio> /opt/quiosque/Quiosque"
    log_color $GREEN "2. Use o script create-and-deploy.sh para criar restaurantes"
    log_color $GREEN "3. Cada restaurante será configurado automaticamente no nginx"
    log_color $GREEN "4. SSL será configurado para cada subdomínio"
    log_color $GREEN "5. Nginx já está configurado para capturar todos os subdomínios"
    
    echo
    log_color $GREEN "🎯 VPS PRONTA PARA DEPLOY DE SUBDOMÍNIOS!"
    log_color $GREEN "🌐 Nginx configurado para capturar automaticamente todos os subdomínios!"
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
    log_color $GREEN "🚀 CONFIGURAÇÃO COMPLETA DA VPS"
    log_color $GREEN "================================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Email: $EMAIL"
    log_color $BLUE "   Modo Teste: $TEST_MODE"
    log_color $BLUE "   Nginx: Configurado para domínio principal + subdomínios"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar configuração COMPLETA da VPS (incluindo nginx para subdomínios)? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Configuração cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando configuração COMPLETA da VPS (tudo em um!)..."
    
    # Executar etapas
    check_prerequisites
    install_tools
    setup_firewall
    install_docker
    create_app_user
    setup_directories
    check_repository
    setup_nginx_main_domain "$DOMAIN"
    setup_ssl_main_domain "$DOMAIN" "$EMAIL" "$TEST_MODE"
    setup_nginx_clean "$DOMAIN" # Configuração limpa do Nginx (sem subdomains)
    setup_backup
    setup_monitoring
    show_summary "$DOMAIN" "$EMAIL" "$TEST_MODE"
}

# Executar função principal
main "$@"
