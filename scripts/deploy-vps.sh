#!/bin/bash
# ========================================
# SCRIPT AUTOMATIZADO PARA DEPLOY EM VPS UBUNTU
# ========================================
# Este script automatiza todo o processo de deploy em uma VPS Ubuntu
# DEVE ser executado como root

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

# Função para clonar repositório
clone_repository() {
    log_color $BLUE "📥 Clonando repositório..."
    
    cd /opt/quiosque
    
    # Clonar repositório (ajuste a URL conforme necessário)
    if [ ! -d "Quiosque" ]; then
        su - quiosque -c "cd /opt/quiosque && git clone https://github.com/jeferson-santos/Quiosque.git"
    else
        su - quiosque -c "cd /opt/quiosque/Quiosque && git pull origin main"
    fi
    
    # Definir permissões
    chown -R quiosque:quiosque /opt/quiosque/Quiosque
    
    log_color $GREEN "✅ Repositório clonado/atualizado"
}

# Função para configurar ambiente
setup_environment() {
    log_color $BLUE "⚙️ Configurando ambiente..."
    
    cd /opt/quiosque/Quiosque
    
    # Copiar arquivo de exemplo
    if [ ! -f ".env" ]; then
        cp env.prod.example .env
        log_color $YELLOW "⚠️ Arquivo .env criado a partir do exemplo"
        log_color $YELLOW "⚠️ Configure as variáveis antes de continuar"
        log_color $YELLOW "⚠️ Pressione Enter quando estiver pronto..."
        read
    fi
    
    log_color $GREEN "✅ Ambiente configurado"
}

# Função para criar cliente
create_client() {
    log_color $BLUE "🏪 Criando cliente..."
    
    cd /opt/quiosque/Quiosque
    
    # Tornar script executável
    chmod +x create-and-deploy.sh
    
    # Criar cliente (ajuste os parâmetros conforme necessário)
    log_color $YELLOW "⚠️ Executando criação de cliente..."
    log_color $YELLOW "⚠️ Ajuste os parâmetros conforme necessário"
    
    # Exemplo de criação (descomente e ajuste):
    # su - quiosque -c "cd /opt/quiosque/Quiosque && ./create-and-deploy.sh -n 'Meu Restaurante' -i 'meurestaurante'"
    
    log_color $GREEN "✅ Cliente criado (ou pronto para criação)"
}

# Função para fazer deploy da aplicação
deploy_application() {
    log_color $BLUE "🚀 Fazendo deploy da aplicação..."
    
    cd /opt/quiosque/Quiosque
    
    # Verificar se o docker-compose existe
    if [ -f "docker-compose.meurestaurante.yml" ]; then
        log_color $BLUE "🐳 Subindo serviços..."
        su - quiosque -c "cd /opt/quiosque/Quiosque && docker-compose -f docker-compose.meurestaurante.yml up -d"
        
        # Aguardar serviços estarem prontos
        log_color $BLUE "⏳ Aguardando serviços estarem prontos..."
        sleep 30
        
        # Verificar status
        log_color $BLUE "📊 Verificando status dos serviços..."
        su - quiosque -c "cd /opt/quiosque/Quiosque && docker-compose -f docker-compose.meurestaurante.yml ps"
        
        log_color $GREEN "✅ Aplicação deployada"
    else
        log_color $YELLOW "⚠️ Docker-compose não encontrado"
        log_color $YELLOW "⚠️ Execute a criação de cliente primeiro"
    fi
}

# Função para verificar status
check_status() {
    log_color $BLUE "📊 Verificando status geral..."
    
    echo
    log_color $BLUE "🐳 Status do Docker:"
    docker ps
    
    echo
    log_color $BLUE "🔥 Status do Firewall:"
    ufw status
    
    echo
    log_color $BLUE "📁 Diretórios da aplicação:"
    ls -la /opt/quiosque/
    
    echo
    log_color $BLUE "📝 Logs recentes:"
    su - quiosque -c "cd /opt/quiosque/Quiosque && docker-compose -f docker-compose.meurestaurante.yml logs --tail=10" 2>/dev/null || log_color $YELLOW "⚠️ Nenhum log disponível ainda"
}

# Função para mostrar próximos passos
show_next_steps() {
    log_color $GREEN "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
    log_color $GREEN "=================================="
    
    echo
    log_color $BLUE "📋 PRÓXIMOS PASSOS:"
    log_color $BLUE "1. Configure o domínio no DNS"
    log_color $BLUE "2. Configure o Nginx como reverse proxy"
    log_color $BLUE "3. Configure SSL com Certbot"
    log_color $BLUE "4. Configure backup automático"
    log_color $BLUE "5. Configure monitoramento"
    
    echo
    log_color $YELLOW "⚠️ IMPORTANTE:"
    log_color $YELLOW "• Configure as variáveis no arquivo .env"
    log_color $YELLOW "• Ajuste as portas se necessário"
    log_color $YELLOW "• Configure o firewall para suas necessidades"
    
    echo
    log_color $GREEN "📚 DOCUMENTAÇÃO:"
    log_color $GREEN "• README.md - Guia completo do projeto"
    log_color $GREEN "• Scripts na pasta scripts/"
    
    echo
    log_color $BLUE "🔧 COMANDOS ÚTEIS:"
    log_color $BLUE "• Ver status: docker ps"
    log_color $BLUE "• Ver logs: docker logs <container>"
    log_color $BLUE "• Reiniciar: docker-compose restart"
    log_color $BLUE "• Parar: docker-compose down"
}

# Função principal
main() {
    log_color $GREEN "🚀 INICIANDO DEPLOY AUTOMATIZADO PARA VPS UBUNTU"
    log_color $GREEN "=================================================="
    echo
    
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
    
    log_color $BLUE "🔍 Verificando sistema..."
    log_color $BLUE "OS: $(lsb_release -d | cut -f2)"
    log_color $BLUE "Usuário: $USER (root)"
    echo
    
    # Executar etapas
    install_tools
    setup_firewall
    install_docker
    create_app_user
    setup_directories
    clone_repository
    setup_environment
    create_client
    deploy_application
    check_status
    show_next_steps
}

# Executar função principal
main "$@"
