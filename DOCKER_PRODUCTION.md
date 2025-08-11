# 🐳 Deploy em Produção com Docker

Este documento explica como fazer o deploy do Sistema de Quiosque em produção usando Docker.

## 🏗️ Arquitetura de Produção

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│    │  Frontend (80)  │    │  Backend (8000) │
│   (Load Balancer)│    │   (React/TS)    │    │  (FastAPI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  PostgreSQL     │    │     Redis       │
                    │     (5432)      │    │     (6379)      │
                    └─────────────────┘    └─────────────────┘
```

## 📋 Pré-requisitos

- ✅ Docker Engine 20.10+
- ✅ Docker Compose 2.0+
- ✅ 4GB RAM mínimo
- ✅ 20GB espaço em disco
- ✅ Portas 80, 443, 8000, 5432, 6379 disponíveis

## 🚀 Deploy Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.prod env.prod

# Editar configurações
nano env.prod
```

**⚠️ IMPORTANTE:** Altere todas as senhas padrão!

### 2. Executar Deploy

#### **Linux/Mac:**
```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

#### **Windows:**
```powershell
.\scripts\deploy-prod.ps1
```

### 3. Verificar Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Configuração Manual

### 1. Build das Imagens

```bash
# Backend
docker build -t quiosque-backend:latest ./backend

# Frontend
docker build -t quiosque-frontend:latest ./frontend
```

### 2. Iniciar Serviços

```bash
# Usar docker-compose de produção
docker-compose -f docker-compose.prod.yml up -d

# Ou iniciar individualmente
docker run -d --name quiosque-postgres \
  -e POSTGRES_DB=quiosque_prod \
  -e POSTGRES_USER=quiosque_prod_user \
  -e POSTGRES_PASSWORD=SUA_SENHA \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

docker run -d --name quiosque-redis \
  -e REDIS_PASSWORD=SUA_SENHA_REDIS \
  -v redis_data:/data \
  redis:7-alpine

docker run -d --name quiosque-backend \
  -e DATABASE_URL=postgresql://quiosque_prod_user:SUA_SENHA@quiosque-postgres:5432/quiosque_prod \
  -p 8000:8000 \
  quiosque-backend:latest

docker run -d --name quiosque-frontend \
  -p 80:80 \
  quiosque-frontend:latest
```

## 🌐 Configuração de Domínio

### 1. Configurar DNS

```bash
# Exemplo para domínio quiosque.com
A    quiosque.com        → SEU_IP_SERVIDOR
A    www.quiosque.com    → SEU_IP_SERVIDOR
A    api.quiosque.com    → SEU_IP_SERVIDOR
```

### 2. Atualizar CORS

```bash
# Editar env.prod
CORS_ORIGINS=https://quiosque.com,https://www.quiosque.com,https://api.quiosque.com
```

### 3. Configurar Nginx (Opcional)

```bash
# Criar diretório para configurações
mkdir -p nginx/ssl

# Adicionar certificados SSL
cp seu_certificado.pem nginx/ssl/cert.pem
cp sua_chave_privada.key nginx/ssl/key.pem
```

## 🔒 Segurança

### 1. Senhas Fortes

```bash
# Gerar senhas seguras
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

### 2. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 3. Variáveis Sensíveis

```bash
# NUNCA commitar senhas no Git
echo "env.prod" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
```

## 📊 Monitoramento

### 1. Health Checks

```bash
# Verificar saúde dos serviços
docker-compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 2. Métricas

```bash
# Stats dos containers
docker stats

# Uso de recursos
docker system df
```

### 3. Logs

```bash
# Logs do sistema
docker-compose -f docker-compose.prod.yml logs --tail=100

# Logs de erro
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR
```

## 🔄 Atualizações

### 1. Deploy com Zero Downtime

```bash
# 1. Build nova imagem
docker-compose -f docker-compose.prod.yml build backend

# 2. Atualizar serviço
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

# 3. Verificar saúde
docker-compose -f docker-compose.prod.yml ps backend
```

### 2. Rollback

```bash
# Voltar para versão anterior
docker-compose -f docker-compose.prod.yml up -d --no-deps backend:previous
```

## 💾 Backup e Restore

### 1. Backup do Banco

```bash
# Backup manual
docker exec quiosque-postgres pg_dump -U quiosque_prod_user quiosque_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup automático (configurado no docker-compose)
docker-compose -f docker-compose.prod.yml run --rm backup
```

### 2. Restore

```bash
# Restaurar backup
docker exec -i quiosque-postgres psql -U quiosque_prod_user quiosque_prod < backup_arquivo.sql
```

### 3. Backup de Volumes

```bash
# Backup dos volumes
docker run --rm -v quiosque_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore dos volumes
docker run --rm -v quiosque_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## 🚨 Troubleshooting

### 1. Serviço não inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [servico]

# Verificar dependências
docker-compose -f docker-compose.prod.yml config

# Reiniciar serviço
docker-compose -f docker-compose.prod.yml restart [servico]
```

### 2. Problemas de conectividade

```bash
# Testar rede interna
docker-compose -f docker-compose.prod.yml exec backend ping postgres

# Verificar portas
netstat -tulpn | grep :8000
```

### 3. Problemas de permissão

```bash
# Corrigir permissões
sudo chown -R $USER:$USER ./logs
sudo chown -R $USER:$USER ./backup
```

## 📈 Escalabilidade

### 1. Múltiplas Instâncias

```bash
# Escalar backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Escalar frontend
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

### 2. Load Balancer

```bash
# Usar Nginx como load balancer
# Configurar upstream no nginx.conf
upstream backend {
    server backend:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## 🎯 Comandos Úteis

```bash
# Status geral
docker-compose -f docker-compose.prod.yml ps

# Logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs

# Reiniciar todos os serviços
docker-compose -f docker-compose.prod.yml restart

# Parar todos os serviços
docker-compose -f docker-compose.prod.yml down

# Limpar recursos não utilizados
docker system prune -f

# Ver uso de recursos
docker stats --no-stream
```

## 📞 Suporte

Para problemas específicos:

1. **Verificar logs:** `docker-compose -f docker-compose.prod.yml logs [servico]`
2. **Verificar status:** `docker-compose -f docker-compose.prod.yml ps`
3. **Verificar configuração:** `docker-compose -f docker-compose.prod.yml config`
4. **Reiniciar serviço:** `docker-compose -f docker-compose.prod.yml restart [servico]`

## 🔗 Links Úteis

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Nginx Docker](https://hub.docker.com/_/nginx)
