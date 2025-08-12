#!/bin/bash
# ========================================
# SCRIPT DE DEPLOY AUTOMATIZADO PARA VPS UBUNTU
# ========================================
# Este é um exemplo de script que pode ser usado para automatizar
# o deploy em uma VPS Ubuntu

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

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar Docker
install_docker() {
    log_color $BLUE "🐳 Instalando Docker..."
    
    if command_exists docker; then
        log_color $GREEN "✅ Docker já está instalado"
        return
    fi
    
    # Baixar e executar script de instalação
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    # Habilitar Docker no boot
    sudo systemctl enable docker
    
    # Configurar Docker
    sudo mkdir -p /opt/docker
    sudo chown $USER:$USER /opt/docker
    
    # Criar arquivo de configuração
    sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "data-root": "/opt/docker"
}
EOF
    
    # Reiniciar Docker
    sudo systemctl restart docker
    
    log_color $GREEN "✅ Docker instalado e configurado com sucesso!"
}

# Função para configurar firewall
setup_firewall() {
    log_color $BLUE "🔥 Configurando firewall..."
    
    # Habilitar UFW
    sudo ufw --force enable
    
    # Permitir SSH
    sudo ufw allow ssh
    
    # Permitir HTTP/HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    log_color $GREEN "✅ Firewall configurado!"
}

# Função para instalar ferramentas essenciais
install_tools() {
    log_color $BLUE "🛠️ Instalando ferramentas essenciais..."
    
    sudo apt update
    sudo apt install -y curl wget git nano htop ufw fail2ban
    
    # Configurar fail2ban
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF
    
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    log_color $GREEN "✅ Ferramentas instaladas!"
}

# Função para criar usuário da aplicação
create_app_user() {
    log_color $BLUE "👤 Criando usuário da aplicação..."
    
    if id "quiosque" &>/dev/null; then
        log_color $YELLOW "⚠️ Usuário 'quiosque' já existe"
        return
    fi
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        adduser --disabled-password --gecos "" quiosque
        usermod -aG docker quiosque
        usermod -aG sudo quiosque
    else
        # Executando como usuário normal
        sudo adduser --disabled-password --gecos "" quiosque
        sudo usermod -aG docker quiosque
        sudo usermod -aG sudo quiosque
    fi
    
    log_color $GREEN "✅ Usuário 'quiosque' criado!"
}

# Função para configurar diretórios
setup_directories() {
    log_color $BLUE "📁 Configurando diretórios..."
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        su - quiosque -c "mkdir -p /home/quiosque/quiosque/{apps,logs,backups,ssl}"
    else
        # Executando como usuário normal
        sudo -u quiosque mkdir -p /home/quiosque/quiosque/{apps,logs,backups,ssl}
    fi
    
    log_color $GREEN "✅ Diretórios configurados!"
}

# Função para clonar repositório
clone_repository() {
    log_color $BLUE "📥 Clonando repositório..."
    
    cd /home/quiosque/quiosque
    
    if [ -d "Quiosque" ]; then
        log_color $YELLOW "⚠️ Repositório já existe, fazendo pull..."
        cd Quiosque
        if [ "$ROOT_USER" = true ]; then
            su - quiosque -c "cd /home/quiosque/quiosque/Quiosque && git pull origin main"
        else
            sudo -u quiosque git pull origin main
        fi
    else
        if [ "$ROOT_USER" = true ]; then
            su - quiosque -c "cd /home/quiosque/quiosque && git clone https://github.com/jeferson-santos/Quiosque.git"
        else
            sudo -u quiosque git clone https://github.com/jeferson-santos/Quiosque.git
        fi
        cd Quiosque
    fi
    
    log_color $GREEN "✅ Repositório configurado!"
}

# Função para configurar ambiente
setup_environment() {
    log_color $BLUE "⚙️ Configurando ambiente..."
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        su - quiosque -c "cd /home/quiosque/quiosque/Quiosque && cp env.prod.example .env"
        
        # Criar arquivo de configuração personalizado
        su - quiosque -c "cd /home/quiosque/quiosque/Quiosque && cat > .env" <<EOF
    else
        # Executando como usuário normal
        sudo -u quiosque cp env.prod.example .env
        
        # Criar arquivo de configuração personalizado
        sudo -u quiosque tee .env > /dev/null <<EOF
    fi
# ========================================
# CONFIGURACOES DE PRODUCAO - SISTEMA DE QUIOSQUE
# ========================================

# IMPORTANTE: Este arquivo contem configuracoes especificas do cliente
# NUNCA commitar este arquivo no Git!

# ========================================
# IDENTIFICACAO DO CLIENTE
# ========================================
CLIENT_NAME=Restaurante Exemplo
CLIENT_ID=exemplo
ENVIRONMENT=production

# ========================================
# CONFIGURACOES DO BANCO DE DADOS
# ========================================
POSTGRES_DB=quiosque_exemplo
POSTGRES_USER=quiosque_exemplo
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_HOST=postgres_exemplo
POSTGRES_PORT=5432
DATABASE_URL=postgresql://quiosque_exemplo:CHANGE_THIS_PASSWORD@postgres_exemplo:5432/quiosque_exemplo

# ========================================
# CONFIGURACOES DE SEGURANCA
# ========================================
SECRET_KEY=CHANGE_THIS_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ========================================
# CONFIGURACOES DE CORS
# ========================================
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
CORS_ALLOW_CREDENTIALS=true

# ========================================
# CONFIGURACOES REDIS
# ========================================
REDIS_HOST=redis_exemplo
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# ========================================
# CONFIGURACOES DO SERVIDOR
# ========================================
HOST=0.0.0.0
PORT=8000

# ========================================
# CONFIGURACOES DO FRONTEND (VITE)
# ========================================
VITE_API_BASE_URL=https://api.seudominio.com
VITE_DEBUG=false

# ========================================
# CONFIGURACOES DE NEGOCIO
# ========================================
RESTAURANT_NAME=Restaurante Exemplo Ltda
EOF
    else
        # Fechar o heredoc para usuário normal
        RESTAURANT_NAME=Restaurante Exemplo Ltda
EOF
    fi
    
    log_color $YELLOW "⚠️ IMPORTANTE: Edite o arquivo .env com suas configurações reais!"
    log_color $YELLOW "⚠️ Especialmente as senhas e chaves secretas!"
    
    log_color $GREEN "✅ Ambiente configurado!"
}

# Função para criar cliente
create_client() {
    log_color $BLUE "🏪 Criando cliente..."
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        su - quiosque -c "cd /home/quiosque/quiosque/Quiosque && ./scripts/create-client.sh --client-name 'Restaurante Exemplo' --client-id 'exemplo' --domain 'seudominio.com' --restaurant-name 'Restaurante Exemplo Ltda' --skip-confirmation"
    else
        # Executando como usuário normal
        sudo -u quiosque ./scripts/create-client.sh \
            --client-name "Restaurante Exemplo" \
            --client-id "exemplo" \
            --domain "seudominio.com" \
            --restaurant-name "Restaurante Exemplo Ltda" \
            --skip-confirmation
    fi
    
    log_color $GREEN "✅ Cliente criado!"
}

# Função para fazer deploy
deploy_application() {
    log_color $BLUE "🚀 Fazendo deploy da aplicação..."
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        su - quiosque -c "cd /home/quiosque/quiosque/Quiosque && ./deploy-exemplo.sh"
    else
        # Executando como usuário normal
        sudo -u quiosque ./deploy-exemplo.sh
    fi
    
    log_color $GREEN "✅ Deploy concluído!"
}

# Função para verificar status
check_status() {
    log_color $BLUE "📊 Verificando status dos serviços..."
    
    # Aguardar um pouco para os serviços estabilizarem
    sleep 10
    
    if [ "$ROOT_USER" = true ]; then
        # Executando como root
        su - quiosque -c "docker ps"
        
        # Verificar logs
        log_color $YELLOW "📋 Logs do Backend:"
        su - quiosque -c "docker logs quiosque_backend_exemplo --tail 10"
        
        log_color $YELLOW "📋 Logs do Frontend:"
        su - quiosque -c "docker logs quiosque_frontend_exemplo --tail 5"
    else
        # Executando como usuário normal
        sudo -u quiosque docker ps
        
        # Verificar logs
        log_color $YELLOW "📋 Logs do Backend:"
        sudo -u quiosque docker logs quiosque_backend_exemplo --tail 10
        
        log_color $YELLOW "📋 Logs do Frontend:"
        sudo -u quiosque docker logs quiosque_frontend_exemplo --tail 5
    fi
    
    log_color $GREEN "✅ Verificação concluída!"
}

# Função para mostrar próximos passos
show_next_steps() {
    log_color $GREEN "🎉 Deploy automatizado concluído com sucesso!"
    echo
    log_color $BLUE "📋 Próximos passos:"
    echo
    
    if [ "$ROOT_USER" = true ]; then
        log_color $YELLOW "1. Edite o arquivo .env com suas configurações reais:"
        log_color $BLUE "   su - quiosque -c 'nano /home/quiosque/quiosque/Quiosque/.env'"
        echo
        log_color $YELLOW "2. Recrie o cliente com suas configurações:"
        log_color $BLUE "   su - quiosque"
        log_color $BLUE "   cd /home/quiosque/quiosque/Quiosque"
        log_color $BLUE "   ./scripts/create-client.sh --client-name 'Seu Restaurante' --client-id 'seurestaurante' --domain 'seudominio.com' --skip-confirmation"
        echo
        log_color $YELLOW "3. Faça o deploy:"
        log_color $BLUE "   ./deploy-seurestaurante.sh"
        echo
        log_color $YELLOW "4. Configure DNS e SSL (consulte DEPLOY_VPS_UBUNTU.md)"
        echo
        log_color $GREEN "📚 Documentação completa: docs/DEPLOY_VPS_UBUNTU.md"
        echo
        log_color $YELLOW "💡 Dica: Para facilitar, você pode mudar para o usuário quiosque:"
        log_color $BLUE "   su - quiosque"
    else
        log_color $YELLOW "1. Edite o arquivo .env com suas configurações reais:"
        log_color $BLUE "   sudo -u quiosque nano /home/quiosque/quiosque/Quiosque/.env"
        echo
        log_color $YELLOW "2. Recrie o cliente com suas configurações:"
        log_color $BLUE "   cd /home/quiosque/quiosque/Quiosque"
        log_color $BLUE "   sudo -u quiosque ./scripts/create-client.sh --client-name 'Seu Restaurante' --client-id 'seurestaurante' --domain 'seudominio.com' --skip-confirmation"
        echo
        log_color $YELLOW "3. Faça o deploy:"
        log_color $BLUE "   sudo -u quiosque ./deploy-seurestaurante.sh"
        echo
        log_color $YELLOW "4. Configure DNS e SSL (consulte DEPLOY_VPS_UBUNTU.md)"
        echo
        log_color $GREEN "📚 Documentação completa: docs/DEPLOY_VPS_UBUNTU.md"
    fi
}

# Função principal
main() {
    log_color $GREEN "🚀 INICIANDO DEPLOY AUTOMATIZADO PARA VPS UBUNTU"
    log_color $GREEN "=================================================="
    echo
    
    # Verificar se é root
    if [ "$EUID" -eq 0 ]; then
        log_color $YELLOW "⚠️ Executando como root - algumas configurações serão ajustadas"
        ROOT_USER=true
    else
        ROOT_USER=false
    fi
    
    # Verificar sistema operacional
    if ! command_exists lsb_release || ! lsb_release -d | grep -q "Ubuntu"; then
        log_color $RED "❌ Este script é específico para Ubuntu!"
        exit 1
    fi
    
    log_color $BLUE "🔍 Verificando sistema..."
    log_color $BLUE "OS: $(lsb_release -d | cut -f2)"
    log_color $BLUE "Usuário: $USER"
    log_color $BLUE "Root: $ROOT_USER"
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
