#!/bin/bash
# ========================================
# SCRIPT PARA GERAR CONFIGURAÇÃO DO NGINX
# ========================================
# Este script gera automaticamente a configuração do nginx
# para todos os clientes baseado nos arquivos docker-compose existentes

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
    echo "🌐 Script para Gerar Configuração do Nginx"
    echo "=========================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -d, --domain DOMAIN        Domínio principal (ex: meudominio.com)"
    echo "  -o, --output FILE          Arquivo de saída (padrão: nginx-main.conf)"
    echo "  -h, --help                 Mostrar esta ajuda"
    echo
    echo "EXEMPLOS:"
    echo "  $0 -d meudominio.com"
    echo "  $0 -d meudominio.com -o /etc/nginx/sites-available/default"
    echo
}

# Função para detectar clientes existentes
detect_clients() {
    log_color $BLUE "🔍 Detectando clientes existentes..."
    
    local clients=()
    
    # Procurar por arquivos docker-compose.*.yml
    for file in docker-compose.*.yml; do
        if [[ -f "$file" ]]; then
            # Extrair nome do cliente do nome do arquivo
            local client_id=$(echo "$file" | sed 's/docker-compose\.\(.*\)\.yml/\1/')
            clients+=("$client_id")
        fi
    done
    
    if [ ${#clients[@]} -eq 0 ]; then
        log_color $YELLOW "⚠️ Nenhum cliente encontrado"
        return 1
    fi
    
    log_color $GREEN "✅ Clientes detectados: ${clients[*]}"
    
    # Retornar array de clientes
    echo "${clients[@]}"
}

# Função para obter portas de um cliente
get_client_ports() {
    local client_id="$1"
    local env_file=".env"
    
    if [[ -f "$env_file" ]]; then
        # Tentar ler portas do arquivo .env
        local frontend_port=$(grep "^FRONTEND_PORT=" "$env_file" | cut -d'=' -f2 || echo "80")
        local backend_port=$(grep "^BACKEND_PORT=" "$env_file" | cut -d'=' -f2 || echo "8000")
        
        echo "$frontend_port:$backend_port"
    else
        # Valores padrão se não encontrar .env
        echo "80:8000"
    fi
}

# Função para gerar configuração do nginx
generate_nginx_config() {
    local domain="$1"
    local clients=("${@:2}")
    local output_file="$3"
    
    log_color $BLUE "📝 Gerando configuração do nginx..."
    
    # Criar arquivo de configuração
    cat > "$output_file" << EOF
# ========================================
# CONFIGURAÇÃO PRINCIPAL DO NGINX
# ========================================
# Gerado automaticamente pelo script generate-nginx-config.sh
# Data: $(date)
# Clientes: ${clients[*]}

# Configuração principal do servidor HTTP
server {
    listen 80;
    server_name _;  # Captura todos os domínios
    
    # Logs principais
    access_log /var/log/nginx/main.access.log;
    error_log /var/log/nginx/main.error.log;
    
    # Configuração para subdomínios dinâmicos
    # O nginx vai redirecionar baseado no host header
    
EOF

    # Adicionar configuração para cada cliente
    for client_id in "${clients[@]}"; do
        local ports=$(get_client_ports "$client_id")
        local frontend_port=$(echo "$ports" | cut -d':' -f1)
        local backend_port=$(echo "$ports" | cut -d':' -f2)
        
        cat >> "$output_file" << EOF
    
    # Subdomínio: $client_id
    if (\$host = "$client_id.$domain") {
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
    }
EOF
    done
    
    # Finalizar configuração HTTP
    cat >> "$output_file" << EOF
    
    # Padrão: redirecionar para página de erro ou domínio principal
    location / {
        return 404 "Subdomínio não configurado. Clientes disponíveis: ${clients[*]}";
    }
    
    # Health check global
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Status do nginx
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}

# Configuração para HTTPS (quando configurado)
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL configurado pelo Certbot
    # ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    
    # Redirecionar HTTP para HTTPS
    if (\$scheme != "https") {
        return 301 https://\$host\$request_uri;
    }
    
EOF

    # Adicionar configuração HTTPS para cada cliente
    for client_id in "${clients[@]}"; do
        local ports=$(get_client_ports "$client_id")
        local frontend_port=$(echo "$ports" | cut -d':' -f1)
        local backend_port=$(echo "$ports" | cut -d':' -f2)
        
        cat >> "$output_file" << EOF
    
    # Subdomínio HTTPS: $client_id
    if (\$host = "$client_id.$domain") {
        location / {
            proxy_pass http://localhost:$frontend_port;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            try_files \$uri \$uri/ /index.html;
            
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
        
        location /api/ {
            proxy_pass http://localhost:$backend_port;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        location /docs {
            proxy_pass http://localhost:$backend_port;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location /health {
            proxy_pass http://localhost:$backend_port;
            proxy_set_header Host \$host;
        }
    }
EOF
    done
    
    # Finalizar configuração HTTPS
    cat >> "$output_file" << EOF
    
    # Padrão HTTPS
    location / {
        return 404 "Subdomínio não configurado. Clientes disponíveis: ${clients[*]}";
    }
}
EOF

    log_color $GREEN "✅ Configuração do nginx gerada em: $output_file"
}

# Função para aplicar configuração
apply_nginx_config() {
    local output_file="$1"
    
    log_color $BLUE "🔧 Aplicando configuração do nginx..."
    
    # Verificar se o arquivo foi gerado
    if [[ ! -f "$output_file" ]]; then
        log_color $RED "❌ Arquivo de configuração não encontrado: $output_file"
        return 1
    fi
    
    # Testar configuração
    if nginx -t -c "$output_file" 2>/dev/null; then
        log_color $GREEN "✅ Configuração do nginx válida"
        
        # Se o arquivo for para o nginx, aplicar
        if [[ "$output_file" == "/etc/nginx/sites-available/"* ]]; then
            log_color $BLUE "🚀 Aplicando configuração..."
            
            # Copiar para sites-available
            sudo cp "$output_file" "/etc/nginx/sites-available/"
            
            # Habilitar site
            local site_name=$(basename "$output_file")
            sudo ln -sf "/etc/nginx/sites-available/$site_name" "/etc/nginx/sites-enabled/"
            
            # Recarregar nginx
            sudo systemctl reload nginx
            
            log_color $GREEN "✅ Configuração aplicada e nginx recarregado"
        fi
    else
        log_color $RED "❌ Configuração do nginx inválida"
        return 1
    fi
}

# Função para mostrar resumo
show_summary() {
    local domain="$1"
    local clients=("${@:2}")
    local output_file="$3"
    
    log_color $GREEN "🎉 CONFIGURAÇÃO DO NGINX GERADA!"
    log_color $GREEN "================================="
    
    echo
    log_color $BLUE "📋 RESUMO:"
    log_color $BLUE "   ✅ Domínio principal: $domain"
    log_color $BLUE "   ✅ Clientes configurados: ${clients[*]}"
    log_color $BLUE "   ✅ Arquivo gerado: $output_file"
    
    echo
    log_color $BLUE "🌐 SUBDOMÍNIOS CONFIGURADOS:"
    for client_id in "${clients[@]}"; do
        local ports=$(get_client_ports "$client_id")
        local frontend_port=$(echo "$ports" | cut -d':' -f1)
        local backend_port=$(echo "$ports" | cut -d':' -f2)
        
        log_color $BLUE "   • $client_id.$domain"
        log_color $BLUE "     Frontend: localhost:$frontend_port"
        log_color $BLUE "     Backend: localhost:$backend_port"
    done
    
    echo
    log_color $YELLOW "⚠️ PRÓXIMOS PASSOS:"
    log_color $YELLOW "   1. Configure os registros DNS para os subdomínios"
    log_color $YELLOW "   2. Configure SSL com Certbot para cada subdomínio"
    log_color $YELLOW "   3. Teste o acesso via HTTPS"
    
    if [[ "$output_file" == "/etc/nginx/sites-available/"* ]]; then
        echo
        log_color $GREEN "✅ Configuração já aplicada ao nginx!"
    else
        echo
        log_color $BLUE "🔧 Para aplicar a configuração:"
        log_color $BLUE "   sudo $0 -d $domain -o /etc/nginx/sites-available/default"
    fi
}

# Função principal
main() {
    # Variáveis
    local DOMAIN=""
    local OUTPUT_FILE="nginx-main.conf"
    
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
            -o|--output)
                OUTPUT_FILE="$2"
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
    
    # Mostrar resumo da configuração
    log_color $GREEN "🌐 GERADOR DE CONFIGURAÇÃO DO NGINX"
    log_color $GREEN "===================================="
    echo
    log_color $BLUE "📋 RESUMO DA CONFIGURAÇÃO:"
    log_color $BLUE "   Domínio Principal: $DOMAIN"
    log_color $BLUE "   Arquivo de Saída: $OUTPUT_FILE"
    echo
    
    # Confirmar configuração
    read -p "❓ Confirmar geração da configuração? (S/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_color $YELLOW "❌ Geração cancelada pelo usuário"
        exit 0
    fi
    
    log_color $GREEN "🚀 Iniciando geração da configuração..."
    
    # Detectar clientes
    local clients=($(detect_clients))
    if [ $? -ne 0 ]; then
        log_color $RED "❌ Nenhum cliente encontrado"
        exit 1
    fi
    
    # Gerar configuração
    generate_nginx_config "$DOMAIN" "${clients[@]}" "$OUTPUT_FILE"
    
    # Aplicar configuração se for para o nginx
    if [[ "$OUTPUT_FILE" == "/etc/nginx/sites-available/"* ]]; then
        apply_nginx_config "$OUTPUT_FILE"
    fi
    
    # Mostrar resumo
    show_summary "$DOMAIN" "${clients[@]}" "$OUTPUT_FILE"
}

# Executar função principal
main "$@"
