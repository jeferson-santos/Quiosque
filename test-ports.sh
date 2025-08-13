#!/bin/bash

# Script de teste para verificar funções de portas

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

# Função para verificar se uma porta está disponível
check_port_available() {
    local port=$1
    
    # Verificar se a porta está em uso
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tln 2>/dev/null | grep -q ":$port "; then
            return 1  # Porta ocupada
        else
            return 0  # Porta livre
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -tln 2>/dev/null | grep -q ":$port "; then
            return 1  # Porta ocupada
        else
            return 0  # Porta livre
        fi
    else
        # Fallback: tentar conectar na porta
        if (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1; then
            return 1  # Porta ocupada
        else
            return 0  # Porta livre
        fi
    fi
}

# Função para encontrar próxima porta disponível
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    log_color $BLUE "      Testando porta $port..."
    
    while ! check_port_available $port; do
        log_color $YELLOW "      ⚠️ Porta $port está ocupada, tentando próxima..."
        port=$((port + 1))
        
        # Evitar loop infinito
        if [ $port -gt 65535 ]; then
            log_color $RED "❌ Erro: Não foi possível encontrar porta disponível"
            exit 1
        fi
        
        log_color $BLUE "      Testando porta $port..."
    done
    
    log_color $GREEN "      ✅ Porta $port está disponível!"
    echo $port
}

# Função para verificar e configurar portas disponíveis
configure_available_ports() {
    log_color $BLUE "🔍 Verificando portas disponíveis..."
    
    # Verificar porta do frontend (padrão: 80)
    log_color $BLUE "   Verificando porta 80 (frontend)..."
    local frontend_port=$(find_available_port 80)
    if [ $frontend_port -ne 80 ]; then
        log_color $YELLOW "⚠️ Porta 80 ocupada, usando porta $frontend_port para frontend"
    else
        log_color $GREEN "✅ Porta 80 disponível para frontend"
    fi
    
    # Verificar porta do backend (padrão: 8000)
    log_color $BLUE "   Verificando porta 8000 (backend)..."
    local backend_port=$(find_available_port 8000)
    if [ $backend_port -ne 8000 ]; then
        log_color $YELLOW "⚠️ Porta 8000 ocupada, usando porta $backend_port para backend"
    else
        log_color $GREEN "✅ Porta 8000 disponível para backend"
    fi
    
    # Verificar porta do PostgreSQL (padrão: 5432)
    log_color $BLUE "   Verificando porta 5432 (PostgreSQL)..."
    local postgres_port=$(find_available_port 5432)
    if [ $postgres_port -ne 5432 ]; then
        log_color $YELLOW "⚠️ Porta 5432 ocupada, usando porta $postgres_port para PostgreSQL"
    else
        log_color $GREEN "✅ Porta 5432 disponível para PostgreSQL"
    fi
    
    # Verificar porta do Redis (padrão: 6379)
    log_color $BLUE "   Verificando porta 6379 (Redis)..."
    local redis_port=$(find_available_port 6379)
    if [ $redis_port -ne 6379 ]; then
        log_color $YELLOW "⚠️ Porta 6379 ocupada, usando porta $redis_port para Redis"
    else
        log_color $GREEN "✅ Porta 6379 disponível para Redis"
    fi
    
    # Salvar portas escolhidas para uso posterior
    FRONTEND_PORT_CHOSEN=$frontend_port
    BACKEND_PORT_CHOSEN=$backend_port
    POSTGRES_PORT_CHOSEN=$postgres_port
    REDIS_PORT_CHOSEN=$redis_port
    
    log_color $GREEN "🎯 Portas configuradas:"
    log_color $GREEN "   Frontend: $frontend_port"
    log_color $GREEN "   Backend: $backend_port"
    log_color $GREEN "   PostgreSQL: $postgres_port"
    log_color $GREEN "   Redis: $redis_port"
    
    log_color $BLUE "✅ Verificação de portas concluída!"
}

# Executar teste
log_color $GREEN "🚀 Iniciando teste de verificação de portas..."
configure_available_ports
log_color $GREEN "�� Teste concluído!"
