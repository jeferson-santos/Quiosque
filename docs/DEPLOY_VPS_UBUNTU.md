# 🚀 Guia de Deploy em VPS Ubuntu - Sistema de Quiosque

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação da VPS](#preparação-da-vps)
3. [Instalação do Docker](#instalação-do-docker)
4. [Configuração do Sistema](#configuração-do-sistema)
5. [Deploy da Aplicação](#deploy-da-aplicação)
6. [Configuração de Domínio](#configuração-de-domínio)
7. [SSL/HTTPS](#sslhttps)
8. [Monitoramento e Logs](#monitoramento-e-logs)
9. [Backup e Manutenção](#backup-e-manutenção)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

- **VPS Ubuntu 20.04 LTS ou superior**
- **Mínimo**: 2GB RAM, 20GB SSD, 1 vCPU
- **Recomendado**: 4GB RAM, 40GB SSD, 2 vCPU
- **Domínio** configurado (opcional, mas recomendado)
- **Acesso SSH** com usuário sudo

---

## 🖥️ Preparação da VPS

### 1.1 Conectar via SSH

```bash
ssh root@SEU_IP_VPS
# ou
ssh usuario@SEU_IP_VPS
```

### 1.2 Atualizar o Sistema

```bash
# Atualizar lista de pacotes
sudo apt update

# Atualizar sistema
sudo apt upgrade -y

# Instalar pacotes essenciais
sudo apt install -y curl wget git nano htop ufw fail2ban
```

### 1.3 Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Verificar status
sudo ufw status
```

### 1.4 Configurar Fail2Ban

```bash
# Configurar fail2ban para SSH
sudo nano /etc/fail2ban/jail.local
```

Adicionar:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
# Reiniciar fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

---

## 🐳 Instalação do Docker

### 2.1 Instalar Docker

```bash
# Baixar script de instalação
curl -fsSL https://get.docker.com -o get-docker.sh

# Executar script
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Habilitar Docker no boot
sudo systemctl enable docker

# Verificar instalação
docker --version
docker-compose --version
```

### 2.2 Configurar Docker

```bash
# Criar diretório para dados do Docker
sudo mkdir -p /opt/docker
sudo chown $USER:$USER /opt/docker

# Configurar limite de logs
sudo nano /etc/docker/daemon.json
```

Adicionar:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "data-root": "/opt/docker"
}
```

```bash
# Reiniciar Docker
sudo systemctl restart docker
```

---

## ⚙️ Configuração do Sistema

### 3.1 Criar Usuário para Aplicação

```bash
# Criar usuário
sudo adduser quiosque
sudo usermod -aG docker quiosque
sudo usermod -aG sudo quiosque

# Mudar para o usuário
su - quiosque
```

### 3.2 Configurar Diretórios

```bash
# Criar estrutura de diretórios
mkdir -p ~/quiosque/{apps,logs,backups,ssl}
cd ~/quiosque

# Clonar repositório
git clone https://github.com/jeferson-santos/Quiosque.git
cd Quiosque
```

### 3.3 Configurar Variáveis de Ambiente

```bash
# Copiar template
cp env.prod.example .env

# Editar configurações
nano .env
```

Configurações importantes para produção:
```bash
# Configurações do Cliente
CLIENT_NAME=Seu Restaurante
CLIENT_ID=seurestaurante
ENVIRONMENT=production

# Configurações do Banco
POSTGRES_PASSWORD=SENHA_FORTE_AQUI
SECRET_KEY=CHAVE_SECRETA_FORTE_AQUI
REDIS_PASSWORD=SENHA_REDIS_FORTE_AQUI

# Configurações de CORS (seu domínio)
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
VITE_API_BASE_URL=https://api.seudominio.com
VITE_CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Configurações de Produção
DEBUG=false
LOG_LEVEL=INFO
```

---

## 🚀 Deploy da Aplicação

### 4.1 Criar Cliente

```bash
# Executar script de criação
./scripts/create-client.sh \
  --client-name "Seu Restaurante" \
  --client-id "seurestaurante" \
  --domain "seudominio.com" \
  --restaurant-name "Seu Restaurante Ltda" \
  --skip-confirmation
```

### 4.2 Ajustar Portas (se necessário)

```bash
# Editar .env para portas específicas
nano .env
```

```bash
# Exemplo de portas personalizadas
BACKEND_PORT=8000
FRONTEND_PORT=80
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### 4.3 Fazer Deploy

```bash
# Executar deploy
./deploy-seurestaurante.sh
```

### 4.4 Verificar Status

```bash
# Verificar containers
docker ps

# Verificar logs
docker logs quiosque_backend_seurestaurante
docker logs quiosque_frontend_seurestaurante
```

---

## 🌐 Configuração de Domínio

### 5.1 Configurar DNS

No seu provedor de DNS, criar registros:

```
# Registro A para o domínio principal
seudominio.com     A     SEU_IP_VPS

# Registro A para subdomínio da API
api.seudominio.com A     SEU_IP_VPS

# Registro CNAME para www
www.seudominio.com CNAME seudominio.com
```

### 5.2 Configurar Nginx (Reverso Proxy)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/quiosque
```

Configuração do Nginx:
```nginx
# Frontend
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Backend
server {
    listen 80;
    server_name api.seudominio.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/quiosque /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 SSL/HTTPS

### 6.1 Instalar Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com -d api.seudominio.com

# Configurar renovação automática
sudo crontab -e
```

Adicionar linha:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6.2 Atualizar Configurações

```bash
# Atualizar .env com HTTPS
nano .env
```

```bash
# Configurações HTTPS
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
VITE_API_BASE_URL=https://api.seudominio.com
VITE_CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

---

## 📊 Monitoramento e Logs

### 7.1 Configurar Logs

```bash
# Criar diretório de logs
mkdir -p ~/quiosque/logs

# Verificar logs em tempo real
docker logs -f quiosque_backend_seurestaurante
docker logs -f quiosque_frontend_seurestaurante
```

### 7.2 Monitoramento Básico

```bash
# Instalar ferramentas de monitoramento
sudo apt install -y htop iotop nethogs

# Verificar uso de recursos
htop
df -h
free -h
```

### 7.3 Configurar Logrotate

```bash
# Criar configuração para logs da aplicação
sudo nano /etc/logrotate.d/quiosque
```

```
/home/quiosque/quiosque/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 quiosque quiosque
}
```

---

## 💾 Backup e Manutenção

### 8.1 Backup do Banco

```bash
# Criar script de backup
nano ~/quiosque/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/quiosque/quiosque/backups"
DB_NAME="quiosque_seurestaurante"
DB_USER="quiosque_seurestaurante"

# Criar backup
docker exec quiosque_postgres_seurestaurante pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup criado: backup_$DATE.sql.gz"
```

```bash
# Tornar executável
chmod +x ~/quiosque/backup-db.sh

# Adicionar ao crontab
crontab -e
```

Adicionar:
```bash
# Backup diário às 2h da manhã
0 2 * * * /home/quiosque/quiosque/backup-db.sh
```

### 8.2 Backup dos Arquivos

```bash
# Criar script de backup dos arquivos
nano ~/quiosque/backup-files.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/quiosque/quiosque/backups"
SOURCE_DIR="/home/quiosque/quiosque"

# Criar backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C $SOURCE_DIR .env docker-compose.*.yml

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +7 -delete

echo "Backup de arquivos criado: files_backup_$DATE.tar.gz"
```

### 8.3 Atualizações

```bash
# Atualizar aplicação
cd ~/quiosque/Quiosque
git pull origin main

# Recriar cliente se necessário
./scripts/create-client.sh --client-name "Seu Restaurante" --client-id "seurestaurante" --domain "seudominio.com" --restaurant-name "Seu Restaurante Ltda" --skip-confirmation

# Fazer deploy
./deploy-seurestaurante.sh
```

---

## 🔧 Troubleshooting

### 9.1 Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker logs CONTAINER_NAME

# Verificar status
docker ps -a

# Verificar recursos
docker stats
```

#### Problemas de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker exec quiosque_postgres_seurestaurante pg_isready

# Verificar variáveis de ambiente
docker exec quiosque_backend_seurestaurante env | grep DATABASE_URL

# Testar conexão
docker exec quiosque_postgres_seurestaurante psql -U quiosque_seurestaurante -d quiosque_seurestaurante -c "SELECT 1;"
```

#### Problemas de Porta
```bash
# Verificar portas em uso
sudo netstat -tlnp

# Verificar firewall
sudo ufw status

# Verificar se porta está sendo usada
sudo lsof -i :8000
```

### 9.2 Comandos Úteis

```bash
# Reiniciar todos os serviços
docker-compose -f docker-compose.seurestaurante.yml restart

# Parar todos os serviços
docker-compose -f docker-compose.seurestaurante.yml down

# Ver logs de todos os serviços
docker-compose -f docker-compose.seurestaurante.yml logs

# Verificar uso de disco
df -h
docker system df

# Limpar containers e imagens não utilizados
docker system prune -a
```

---

## 📞 Suporte

### 10.1 Informações Úteis

- **Logs da aplicação**: `~/quiosque/logs/`
- **Backups**: `~/quiosque/backups/`
- **Configurações**: `~/quiosque/.env`
- **Docker Compose**: `~/quiosque/docker-compose.seurestaurante.yml`

### 10.2 Comandos de Emergência

```bash
# Parar tudo
docker stop $(docker ps -q)

# Remover tudo
docker system prune -a -f

# Reiniciar Docker
sudo systemctl restart docker

# Verificar status dos serviços
sudo systemctl status docker nginx fail2ban
```

---

## 🎯 Checklist de Deploy

- [ ] VPS configurada e atualizada
- [ ] Docker instalado e configurado
- [ ] Firewall e segurança configurados
- [ ] Usuário da aplicação criado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] Cliente criado via script
- [ ] Deploy executado com sucesso
- [ ] Containers rodando e saudáveis
- [ ] DNS configurado
- [ ] Nginx configurado (se necessário)
- [ ] SSL configurado
- [ ] Backups configurados
- [ ] Monitoramento configurado
- [ ] Testes realizados

---

## 📚 Recursos Adicionais

- [Documentação do Docker](https://docs.docker.com/)
- [Documentação do Nginx](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

---

**🎉 Parabéns! Seu sistema de quiosque está rodando em produção!**

Para dúvidas ou problemas, consulte os logs e use os comandos de troubleshooting listados acima.
