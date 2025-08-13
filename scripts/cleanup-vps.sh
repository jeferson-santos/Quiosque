#!/bin/bash
# ========================================
# SCRIPT DE LIMPEZA COMPLETA DA VPS (ATUALIZADO PARA PRODUÇÃO)
# ========================================
# Este script limpa COMPLETAMENTE a VPS:
# - Para e remove TODOS os containers Docker (incluindo Traefik e Portainer)
# - Remove TODOS os volumes Docker
# - Remove TODAS as imagens Docker
# - Remove TODAS as redes Docker
# - Remove TODAS as configurações do Nginx
# - Remove TODOS os certificados SSL
# - Remove TODOS os logs
# - Remove usuário quiosque e permissões
# - Remove cron jobs configurados
# - Remove configurações de firewall
# - Remove diretórios criados
# 
# ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
# DEVE ser executado como root

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Função para mostrar ajuda
show_help() {
    echo "🧹 Script de Limpeza Completa da VPS (ATUALIZADO PARA PRODUÇÃO)"
    echo "==============================================================="
    echo
    echo "Uso: $0 [OPÇÕES]"
    echo
    echo "OPÇÕES:"
    echo "  -f, --force          Forçar limpeza sem confirmação"
    echo "  -d, --docker-only    Limpar apenas Docker (não Nginx)"
    echo "  -n, --nginx-only     Limpar apenas Nginx (não Docker)"
    echo "  -h, --help           Mostrar esta ajuda"
    echo
    echo "⚠️  ATENÇÃO:"
    echo "   Este script REMOVE TUDO da VPS!"
    echo "   Use apenas se tiver certeza absoluta!"
    echo
    echo "EXEMPLOS:"
    echo "  $0                    # Limpeza completa com confirmação"
    echo "  $0 -f                 # Limpeza completa forçada"
    echo "  $0 -d                 # Limpar apenas Docker"
    echo "  $0 -n                 # Limpar apenas Nginx"
    echo
}

# Função para verificar se é root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_color $RED "❌ Este script deve ser executado como root!"
        log_color $RED "❌ Execute: sudo $0"
        exit 1
    fi
}

# Função para mostrar aviso de perigo
show_danger_warning() {
    log_color $RED "🚨 PERIGO! PERIGO! PERIGO! 🚨"
    log_color $RED "================================="
    echo
    log_color $RED "⚠️  ATENÇÃO: Este script vai REMOVER TUDO da VPS!"
    echo
    log_color $YELLOW "🔴 O que será REMOVIDO:"
    log_color $YELLOW "   • TODOS os containers Docker (Traefik, Portainer, etc.)"
    log_color $YELLOW "   • TODOS os volumes Docker (incluindo bancos de dados!)"
    log_color $YELLOW "   • TODAS as imagens Docker"
    log_color $YELLOW "   • TODAS as redes Docker"
    log_color $YELLOW "   • TODAS as configurações do Nginx"
    log_color $YELLOW "   • TODOS os certificados SSL"
    log_color $YELLOW "   • TODOS os logs"
    log_color $YELLOW "   • TODOS os arquivos de configuração"
    log_color $YELLOW "   • Usuário quiosque e permissões"
    log_color $YELLOW "   • Cron jobs configurados"
    log_color $YELLOW "   • Configurações de firewall"
    log_color $YELLOW "   • Diretórios criados (/opt/quiosque)"
    echo
    log_color $RED "💀 Esta operação é IRREVERSÍVEL!"
    log_color $RED "💀 Todos os dados serão PERDIDOS para sempre!"
    echo
    log_color $PURPLE "📋 RESUMO: VPS voltará ao estado inicial (limpa)"
    echo
}

# Função para confirmar limpeza
confirm_cleanup() {
    local force="$1"
    
    if [ "$force" = "true" ]; then
        log_color $YELLOW "⚠️ Modo forçado ativado - pulando confirmação"
        return 0
    fi
    
    show_danger_warning
    
    log_color $RED "❓ Você tem CERTEZA ABSOLUTA que quer continuar?"
    log_color $RED "❓ Digite 'LIMPAR TUDO' para confirmar: "
    read -r confirmation
    
    if [ "$confirmation" != "LIMPAR TUDO" ]; then
        log_color $GREEN "✅ Operação cancelada pelo usuário"
        exit 0
    fi
    
    echo
    log_color $RED "❓ ÚLTIMA CHANCE: Digite 'SIM, QUERO LIMPAR' para confirmar: "
    read -r final_confirmation
    
    if [ "$final_confirmation" != "SIM, QUERO LIMPAR" ]; then
        log_color $GREEN "✅ Operação cancelada pelo usuário"
        exit 0
    fi
    
    echo
    log_color $RED "🚨 CONFIRMADO! Iniciando limpeza COMPLETA da VPS..."
    log_color $RED "🚨 Não há volta! Todos os dados serão perdidos!"
    echo
}

# Função para limpar Docker (incluindo Traefik e Portainer)
cleanup_docker() {
    log_color $BLUE "🐳 Iniciando limpeza do Docker..."
    
    # Verificar se Docker está rodando
    if ! systemctl is-active --quiet docker; then
        log_color $YELLOW "⚠️ Docker não está rodando, iniciando..."
        systemctl start docker
        sleep 2
    fi
    
    # Parar todos os containers
    log_color $BLUE "🛑 Parando todos os containers..."
    if docker ps -q | wc -l | grep -q -v "0"; then
        docker stop $(docker ps -q) 2>/dev/null || true
        log_color $GREEN "   ✅ Containers parados"
    else
        log_color $BLUE "   ℹ️ Nenhum container rodando"
    fi
    
    # Remover todos os containers
    log_color $BLUE "🗑️ Removendo todos os containers..."
    if docker ps -aq | wc -l | grep -q -v "0"; then
        docker rm -f $(docker ps -aq) 2>/dev/null || true
        log_color $GREEN "   ✅ Containers removidos"
    else
        log_color $BLUE "   ℹ️ Nenhum container para remover"
    fi
    
    # Remover todos os volumes
    log_color $BLUE "🗑️ Removendo todos os volumes..."
    if docker volume ls -q | wc -l | grep -q -v "0"; then
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
        log_color $GREEN "   ✅ Volumes removidos"
    else
        log_color $BLUE "   ℹ️ Nenhum volume para remover"
    fi
    
    # Remover todas as imagens
    log_color $BLUE "🗑️ Removendo todas as imagens..."
    if docker images -q | wc -l | grep -q -v "0"; then
        docker rmi -f $(docker images -q) 2>/dev/null || true
        log_color $GREEN "   ✅ Imagens removidas"
    else
        log_color $BLUE "   ℹ️ Nenhuma imagem para remover"
    fi
    
    # Remover todas as redes (exceto as padrão)
    log_color $BLUE "🗑️ Removendo redes customizadas..."
    docker network ls --filter "type=custom" -q | while read -r network; do
        docker network rm "$network" 2>/dev/null || true
    done
    log_color $GREEN "   ✅ Redes customizadas removidas"
    
    # Limpar sistema Docker
    log_color $BLUE "🧹 Limpando sistema Docker..."
    docker system prune -af --volumes 2>/dev/null || true
    log_color $GREEN "   ✅ Sistema Docker limpo"
    
    log_color $GREEN "✅ Limpeza do Docker concluída!"
}

# Função para limpar Nginx
cleanup_nginx() {
    log_color $BLUE "🌐 Iniciando limpeza COMPLETA do Nginx..."
    
    # Parar Nginx
    log_color $BLUE "🛑 Parando Nginx..."
    systemctl stop nginx 2>/dev/null || true
    log_color $GREEN "   ✅ Nginx parado"
    
    # Remover TODAS as configurações de sites
    log_color $BLUE "🗑️ Removendo TODAS as configurações de sites..."
    rm -rf /etc/nginx/sites-available/* 2>/dev/null || true
    rm -rf /etc/nginx/sites-enabled/* 2>/dev/null || true
    log_color $GREEN "   ✅ Configurações de sites removidas"
    
    # Remover certificados SSL COMPLETAMENTE
    log_color $BLUE "🗑️ Removendo TODOS os certificados SSL..."
    if [ -d "/etc/letsencrypt" ]; then
        rm -rf /etc/letsencrypt/* 2>/dev/null || true
        log_color $GREEN "   ✅ Certificados SSL removidos completamente"
    else
        log_color $BLUE "   ℹ️ Nenhum certificado SSL encontrado"
    fi
    
    # Remover logs do Nginx
    log_color $BLUE "🗑️ Removendo logs do Nginx..."
    rm -f /var/log/nginx/*.log 2>/dev/null || true
    log_color $GREEN "   ✅ Logs removidos"
    
    # Remover arquivos de configuração customizados
    log_color $BLUE "🗑️ Removendo configurações customizadas..."
    rm -f /etc/nginx/conf.d/*.conf 2>/dev/null || true
    log_color $GREEN "   ✅ Configurações customizadas removidas"
    
    # Restaurar configuração PADRÃO do Ubuntu
    log_color $BLUE "🔄 Restaurando configuração PADRÃO do Ubuntu..."
    cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}
EOF
    log_color $GREEN "   ✅ Configuração padrão restaurada"
    
    # Habilitar site padrão
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
    log_color $GREEN "   ✅ Site padrão habilitado"
    
    # Testar configuração
    log_color $BLUE "🔧 Testando configuração do Nginx..."
    if nginx -t; then
        log_color $GREEN "   ✅ Configuração válida"
        
        # Iniciar Nginx
        log_color $BLUE "🚀 Iniciando Nginx..."
        systemctl start nginx
        log_color $GREEN "   ✅ Nginx iniciado"
    else
        log_color $RED "   ❌ Erro na configuração do Nginx"
        return 1
    fi
    
    log_color $GREEN "✅ Limpeza COMPLETA do Nginx concluída!"
}

# Função para limpar usuário e permissões
cleanup_user_permissions() {
    log_color $BLUE "👤 Iniciando limpeza de usuário e permissões..."
    
    # Remover usuário quiosque se existir
    if id "quiosque" &>/dev/null; then
        log_color $BLUE "🗑️ Removendo usuário quiosque..."
        
        # Remover cron jobs do usuário
        crontab -u quiosque -r 2>/dev/null || true
        log_color $GREEN "   ✅ Cron jobs do usuário quiosque removidos"
        
        # Remover usuário e diretório home
        userdel -r quiosque 2>/dev/null || true
        log_color $GREEN "   ✅ Usuário quiosque removido"
    else
        log_color $BLUE "   ℹ️ Usuário quiosque não encontrado"
    fi
    
    # Remover arquivo sudoers
    if [ -f "/etc/sudoers.d/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo permissões sudo..."
        rm -f /etc/sudoers.d/quiosque
        log_color $GREEN "   ✅ Permissões sudo removidas"
    fi
    
    log_color $GREEN "✅ Limpeza de usuário e permissões concluída!"
}

# Função para limpar cron jobs
cleanup_cron_jobs() {
    log_color $BLUE "⏰ Iniciando limpeza de cron jobs..."
    
    # Remover cron jobs relacionados ao quiosque
    log_color $BLUE "🗑️ Removendo cron jobs do sistema..."
    
    # Fazer backup do crontab atual
    local backup_file="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S)"
    crontab -l > "$backup_file" 2>/dev/null || true
    
    # Remover linhas relacionadas ao quiosque
    if [ -f "$backup_file" ]; then
        grep -v "quiosque" "$backup_file" | crontab - 2>/dev/null || true
        log_color $GREEN "   ✅ Cron jobs relacionados ao quiosque removidos"
        rm -f "$backup_file"
    else
        log_color $BLUE "   ℹ️ Nenhum cron job encontrado"
    fi
    
    log_color $GREEN "✅ Limpeza de cron jobs concluída!"
}

# Função para limpar firewall e segurança
cleanup_firewall_security() {
    log_color $BLUE "🔥 Iniciando limpeza de firewall e segurança..."
    
    # Resetar UFW para padrão
    log_color $BLUE "🔄 Resetando UFW para padrão..."
    ufw --force reset 2>/dev/null || true
    log_color $GREEN "   ✅ UFW resetado para padrão"
    
    # Remover configurações do Fail2ban
    log_color $BLUE "🗑️ Removendo configurações do Fail2ban..."
    if [ -f "/etc/fail2ban/jail.local" ]; then
        rm -f /etc/fail2ban/jail.local
        log_color $GREEN "   ✅ Configurações do Fail2ban removidas"
    fi
    
    # Reiniciar Fail2ban
    if systemctl is-active --quiet fail2ban; then
        systemctl restart fail2ban
        log_color $GREEN "   ✅ Fail2ban reiniciado"
    fi
    
    log_color $GREEN "✅ Limpeza de firewall e segurança concluída!"
}

# Função para limpar diretórios criados
cleanup_directories() {
    log_color $BLUE "📁 Iniciando limpeza de diretórios criados..."
    
    # Remover diretório /opt/quiosque completamente
    if [ -d "/opt/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo diretório /opt/quiosque..."
        rm -rf /opt/quiosque
        log_color $GREEN "   ✅ Diretório /opt/quiosque removido"
    else
        log_color $BLUE "   ℹ️ Diretório /opt/quiosque não encontrado"
    fi
    
    # Remover diretório /home/quiosque se ainda existir
    if [ -d "/home/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo diretório /home/quiosque..."
        rm -rf /home/quiosque
        log_color $GREEN "   ✅ Diretório /home/quiosque removido"
    fi
    
    # Remover logs criados pelo sistema
    log_color $BLUE "🗑️ Removendo logs do sistema..."
    rm -f /var/log/quiosque_*.log 2>/dev/null || true
    rm -f /var/log/quiosque_*.log.* 2>/dev/null || true
    log_color $GREEN "   ✅ Logs do sistema removidos"
    
    # Remover arquivo de rotação de logs
    if [ -f "/etc/logrotate.d/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo configuração de rotação de logs..."
        rm -f /etc/logrotate.d/quiosque
        log_color $GREEN "   ✅ Configuração de rotação de logs removida"
    fi
    
    log_color $GREEN "✅ Limpeza de diretórios concluída!"
}

# Função para limpar arquivos do sistema
cleanup_system_files() {
    log_color $BLUE "🗂️ Iniciando limpeza de arquivos do sistema..."
    
    # Remover arquivos do projeto em /home/quiosque
    if [ -d "/home/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo arquivos do projeto em /home/quiosque..."
        cd /home/quiosque
        
        # Remover arquivos docker-compose
        rm -f docker-compose.*.yml 2>/dev/null || true
        log_color $GREEN "   ✅ Arquivos docker-compose removidos"
        
        # Remover arquivos .env
        rm -f .env* 2>/dev/null || true
        log_color $GREEN "   ✅ Arquivos .env removidos"
        
        # Remover logs
        rm -rf logs/* 2>/dev/null || true
        log_color $GREEN "   ✅ Logs removidos"
        
        log_color $GREEN "   ✅ Arquivos do projeto removidos"
    else
        log_color $BLUE "   ℹ️ Diretório /home/quiosque não encontrado"
    fi
    
    # Remover arquivos do projeto em /opt/quiosque
    if [ -d "/opt/quiosque" ]; then
        log_color $BLUE "🗑️ Removendo arquivos do projeto em /opt/quiosque..."
        cd /opt/quiosque
        
        # Remover arquivos docker-compose
        rm -f docker-compose.*.yml 2>/dev/null || true
        log_color $GREEN "   ✅ Arquivos docker-compose removidos"
        
        # Remover arquivos .env
        rm -f .env* 2>/dev/null || true
        log_color $GREEN "   ✅ Arquivos .env removidos"
        
        # Remover logs
        rm -rf logs/* 2>/dev/null || true
        log_color $GREEN "   ✅ Logs removidos"
        
        # Remover backups
        rm -rf backups/* 2>/dev/null || true
        log_color $GREEN "   ✅ Backups removidos"
        
        log_color $GREEN "   ✅ Arquivos do projeto em /opt/quiosque removidos"
    else
        log_color $BLUE "   ℹ️ Diretório /opt/quiosque não encontrado"
    fi
    
    log_color $GREEN "✅ Limpeza de arquivos do sistema concluída!"
}

# Função para mostrar resumo da limpeza
show_cleanup_summary() {
    log_color $GREEN "🎉 LIMPEZA COMPLETA DA VPS CONCLUÍDA!"
    log_color $GREEN "======================================="
    
    echo
    log_color $BLUE "📋 RESUMO DO QUE FOI REMOVIDO:"
    log_color $BLUE "   ✅ Todos os containers Docker (Traefik, Portainer, etc.)"
    log_color $BLUE "   ✅ Todos os volumes Docker (bancos de dados)"
    log_color $BLUE "   ✅ Todas as imagens Docker"
    log_color $BLUE "   ✅ Todas as redes Docker customizadas"
    log_color $BLUE "   ✅ Todas as configurações do Nginx"
    log_color $BLUE "   ✅ Todos os certificados SSL"
    log_color $BLUE "   ✅ Todos os logs"
    log_color $BLUE "   ✅ Todos os arquivos de configuração"
    log_color $BLUE "   ✅ Usuário quiosque e permissões"
    log_color $BLUE "   ✅ Cron jobs configurados"
    log_color $BLUE "   ✅ Configurações de firewall"
    log_color $BLUE "   ✅ Diretórios criados (/opt/quiosque)"
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "   • VPS está completamente limpa"
    log_color $YELLOW "   • Nginx está rodando com configuração padrão"
    log_color $YELLOW "   • Docker está limpo e funcionando"
    log_color $YELLOW "   • Todos os dados foram perdidos permanentemente"
    log_color $YELLOW "   • Usuário quiosque foi removido"
    log_color $YELLOW "   • Cron jobs foram removidos"
    log_color $YELLOW "   • Firewall foi resetado para padrão"
    
    echo
    log_color $GREEN "🚀 PRÓXIMOS PASSOS:"
    log_color $GREEN "   1. VPS está pronta para nova instalação"
    log_color $GREEN "   2. Execute o script de setup novamente se necessário"
    log_color $GREEN "   3. Configure novos clientes do zero"
    
    echo
    log_color $RED "💀 LEMBRE-SE: Esta operação foi IRREVERSÍVEL!"
}

# Função principal
main() {
    # Variáveis
    local FORCE_MODE=false
    local DOCKER_ONLY=false
    local NGINX_ONLY=false
    
    # Verificar se há argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -d|--docker-only)
                DOCKER_ONLY=true
                shift
                ;;
            -n|--nginx-only)
                NGINX_ONLY=true
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
    
    # Verificar se é root
    check_root
    
    # Mostrar cabeçalho
    log_color $PURPLE "🧹 SCRIPT DE LIMPEZA COMPLETA DA VPS (ATUALIZADO PARA PRODUÇÃO)"
    log_color $PURPLE "================================================================="
    echo
    
    # Confirmar limpeza
    confirm_cleanup "$FORCE_MODE"
    
    # Executar limpeza baseada nas opções
    if [ "$DOCKER_ONLY" = "true" ]; then
        log_color $BLUE "🐳 Modo Docker apenas selecionado"
        cleanup_docker
    elif [ "$NGINX_ONLY" = "true" ]; then
        log_color $BLUE "🌐 Modo Nginx apenas selecionado"
        cleanup_nginx
    else
        log_color $BLUE "🚀 Modo limpeza completa selecionado"
        cleanup_docker
        cleanup_nginx
        cleanup_user_permissions
        cleanup_cron_jobs
        cleanup_firewall_security
        cleanup_directories
        cleanup_system_files
    fi
    
    # Mostrar resumo
    show_cleanup_summary
}

# Executar função principal
main "$@"
