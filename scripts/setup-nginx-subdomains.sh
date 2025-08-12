#!/bin/bash
# ========================================
# SCRIPT PARA CONFIGURAR NGINX COM SUBDOMÍNIOS
# ========================================
# Este script configura o Nginx como reverse proxy para múltiplos subdomínios
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
    echo "🌐 Script para Configurar Nginx com Subdomínios"
    echo "================================================"
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -s, --subdomains LIST      Lista de subdomínios separados por vírgula"
    echo "  -p, --ports LIST           Listas de portas separadas por vírgula"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com -s 'bater_do_mar,saborbrasileiro' -p '80,8080'"
    echo "  $0 -d meudominio.com -s 'rest1,rest2,rest3' -p '80,8080,8081'"
    echo
}

# Função para criar configuração do Nginx
create_nginx_config() {
    local domain="$1"
    local subdomain="$2"
    local port="$3"
    
    local config_file="/etc/nginx/sites-available/${subdomain}.${domain}"
    
    log_color $BLUE "📝 Criando configuração para ${subdomain}.${domain}..."
    
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

    log_color $GREEN "✅ Configuração criada: $config_file"
}

# Função para criar configuração principal do domínio
create_main_domain_config() {
    local domain="$1"
    local config_file="/etc/nginx/sites-available/${domain}"
    
    log_color $BLUE "📝 Criando configuração principal para ${domain}..."
    
    cat > "$config_file" << EOF
# Configuração principal para ${domain}
server {
    listen 80;
    server_name ${domain} www.${domain};
    
    # Logs
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
    
    # Redirecionar para subdomínio padrão ou mostrar página de boas-vindas
    location / {
        # Opção 1: Redirecionar para subdomínio padrão
        return 301 http://admin.${domain};
        
        # Opção 2: Mostrar página de boas-vindas (descomente se preferir)
        # root /var/www/html;
        # index index.html;
    }
    
    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

    log_color $GREEN "✅ Configuração principal criada: $config_file"
}

# Função para criar configuração de admin
create_admin_config() {
    local domain="$1"
    local config_file="/etc/nginx/sites-available/admin.${domain}"
    
    log_color $BLUE "📝 Criando configuração para admin.${domain}..."
    
    cat > "$config_file" << EOF
# Configuração para admin.${domain}
server {
    listen 80;
    server_name admin.${domain};
    
    # Logs
    access_log /var/log/nginx/admin.${domain}.access.log;
    error_log /var/log/nginx/admin.${domain}.error.log;
    
    # Página administrativa ou dashboard
    location / {
        root /var/www/admin;
        index index.html;
        
        # Configurações para SPA
        try_files \$uri \$uri/ /index.html;
    }
    
    # Health check
    location /health {
        return 200 "Admin OK";
        add_header Content-Type text/plain;
    }
}
EOF

    log_color $GREEN "✅ Configuração admin criada: $config_file"
}

# Função para habilitar sites
enable_sites() {
    local domain="$1"
    local subdomains="$2"
    
    log_color $BLUE "🔗 Habilitando sites..."
    
    # Habilitar domínio principal
    if [ -f "/etc/nginx/sites-available/${domain}" ]; then
        ln -sf "/etc/nginx/sites-available/${domain}" "/etc/nginx/sites-enabled/"
        log_color $GREEN "✅ Domínio principal habilitado"
    fi
    
    # Habilitar admin
    if [ -f "/etc/nginx/sites-available/admin.${domain}" ]; then
        ln -sf "/etc/nginx/sites-available/admin.${domain}" "/etc/nginx/sites-enabled/"
        log_color $GREEN "✅ Admin habilitado"
    fi
    
    # Habilitar subdomínios
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)  # Remove espaços
        if [ -f "/etc/nginx/sites-available/${subdomain}.${domain}" ]; then
            ln -sf "/etc/nginx/sites-available/${subdomain}.${domain}" "/etc/nginx/sites-enabled/"
            log_color $GREEN "✅ Subdomínio ${subdomain}.${domain} habilitado"
        fi
    done
}

# Função para criar página de admin
create_admin_page() {
    local domain="$1"
    local subdomains="$2"
    
    log_color $BLUE "📄 Criando página administrativa..."
    
    # Criar diretório
    mkdir -p /var/www/admin
    
    # Criar página HTML
    cat > "/var/www/admin/index.html" << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .restaurant { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .restaurant h3 { margin: 0 0 10px 0; color: #007bff; }
        .restaurant p { margin: 5px 0; color: #666; }
        .status { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        .status.online { background: #d4edda; color: #155724; }
        .status.offline { background: #f8d7da; color: #721c24; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏪 Sistema de Quiosque - ${domain}</h1>
        <p style="text-align: center; color: #666;">Painel Administrativo</p>
        
        <div class="restaurant">
            <h3>🔧 Painel Administrativo</h3>
            <p><strong>URL:</strong> <a href="http://admin.${domain}" target="_blank">admin.${domain}</a></p>
            <p><strong>Status:</strong> <span class="status online">ONLINE</span></p>
        </div>
EOF

    # Adicionar restaurantes dinamicamente
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)  # Remove espaços
        cat >> "/var/www/admin/index.html" << EOF
        
        <div class="restaurant">
            <h3>🍽️ ${subdomain^}</h3>
            <p><strong>Frontend:</strong> <a href="http://${subdomain}.${domain}" target="_blank">${subdomain}.${domain}</a></p>
            <p><strong>API:</strong> <a href="http://${subdomain}.${domain}/docs" target="_blank">${subdomain}.${domain}/docs</a></p>
            <p><strong>Status:</strong> <span class="status online">ONLINE</span></p>
        </div>
EOF
    done

    # Finalizar HTML
    cat >> "/var/www/admin/index.html" << EOF
        
        <div class="footer">
            <p>Sistema de Quiosque - ${domain}</p>
            <p>Última atualização: $(date)</p>
        </div>
    </div>
</body>
</html>
EOF

    # Definir permissões
    chown -R www-data:www-data /var/www/admin
    chmod -R 755 /var/www/admin
    
    log_color $GREEN "✅ Página administrativa criada"
}

# Função para testar configuração
test_nginx_config() {
    log_color $BLUE "🧪 Testando configuração do Nginx..."
    
    if nginx -t; then
        log_color $GREEN "✅ Configuração do Nginx válida"
        return 0
    else
        log_color $RED "❌ Erro na configuração do Nginx"
        return 1
    fi
}

# Função para recarregar Nginx
reload_nginx() {
    log_color $BLUE "🔄 Recarregando Nginx..."
    
    if systemctl reload nginx; then
        log_color $GREEN "✅ Nginx recarregado com sucesso"
    else
        log_color $RED "❌ Erro ao recarregar Nginx"
        return 1
    fi
}

# Função para mostrar resumo
show_summary() {
    local domain="$1"
    local subdomains="$2"
    
    log_color $GREEN "🎉 CONFIGURAÇÃO NGINX CONCLUÍDA!"
    log_color $GREEN "=================================="
    
    echo
    log_color $BLUE "📋 DOMÍNIOS CONFIGURADOS:"
    log_color $BLUE "   • Principal: ${domain}"
    log_color $BLUE "   • Admin: admin.${domain}"
    
    echo
    log_color $BLUE "🍽️ SUBDOMÍNIOS DOS RESTAURANTES:"
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $BLUE "   • ${subdomain}.${domain}"
    done
    
    echo
    log_color $BLUE "📁 ARQUIVOS CRIADOS:"
    log_color $BLUE "   • /etc/nginx/sites-available/${domain}"
    log_color $BLUE "   • /etc/nginx/sites-available/admin.${domain}"
    
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $BLUE "   • /etc/nginx/sites-available/${subdomain}.${domain}"
    done
    
    echo
    log_color $YELLOW "⚠️ PRÓXIMOS PASSOS:"
    log_color $YELLOW "1. Configure os registros DNS para apontar para esta VPS"
    log_color $YELLOW "2. Execute o script de SSL para configurar HTTPS"
    log_color $YELLOW "3. Configure as portas nos arquivos .env dos clientes"
    
    echo
    log_color $GREEN "🌐 URLs de Acesso:"
    log_color $GREEN "   • Admin: http://admin.${domain}"
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$subdomains"
    for subdomain in "${SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "$subdomain" | xargs)
        log_color $GREEN "   • ${subdomain}: http://${subdomain}.${domain}"
    done
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
    local SUBDOMAINS=""
    local PORTS=""
    
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
            -p|--ports)
                PORTS="$2"
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
    if [[ -z "$DOMAIN" ]]; then
        log_color $RED "❌ Domínio é obrigatório (-d ou --domain)"
        exit 1
    fi
    
    if [[ -z "$SUBDOMAINS" ]]; then
        log_color $RED "❌ Subdomínios são obrigatórios (-s ou --subdomains)"
        exit 1
    fi
    
    # Definir portas padrão se não fornecidas
    if [[ -z "$PORTS" ]]; then
        PORTS="80,8080,8081,8082,8083"
        log_color $YELLOW "⚠️ Portas padrão definidas: $PORTS"
    fi
    
    # Verificar se é root
    if [ "$EUID" -ne 0 ]; then
        log_color $RED "❌ Este script deve ser executado como root!"
        log_color $RED "❌ Execute: sudo $0"
        exit 1
    fi
    
    # Mostrar resumo da configuração
    log_color $GREEN "🌐 CONFIGURAÇÃO DE SUBDOMÍNIOS NGINX"
    log_color $GREEN "====================================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Subdomínios: $SUBDOMAINS"
    log_color $BLUE "   Portas: $PORTS"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar configuração? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Configuração cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando configuração do Nginx..."
    
    # Executar etapas
    create_main_domain_config "$DOMAIN"
    create_admin_config "$DOMAIN"
    
    # Criar configurações para cada subdomínio
    IFS=',' read -ra SUBDOMAIN_ARRAY <<< "$SUBDOMAINS"
    IFS=',' read -ra PORT_ARRAY <<< "$PORTS"
    
    for i in "${!SUBDOMAIN_ARRAY[@]}"; do
        subdomain=$(echo "${SUBDOMAIN_ARRAY[$i]}" | xargs)
        port="${PORT_ARRAY[$i]:-80}"
        create_nginx_config "$DOMAIN" "$subdomain" "$port"
    done
    
    # Criar página administrativa
    create_admin_page "$DOMAIN" "$SUBDOMAINS"
    
    # Habilitar sites
    enable_sites "$DOMAIN" "$SUBDOMAINS"
    
    # Testar configuração
    if test_nginx_config; then
        # Recarregar Nginx
        reload_nginx
        
        # Mostrar resumo
        show_summary "$DOMAIN" "$SUBDOMAINS"
    else
        log_color $RED "❌ Falha na configuração do Nginx"
        exit 1
    fi
}

# Executar função principal
main "$@"
