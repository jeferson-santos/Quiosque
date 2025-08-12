# Script de Deploy para VPS Ubuntu

## 📋 Descrição

Este script automatiza todo o processo de deploy do Sistema de Quiosque em uma VPS Ubuntu, incluindo:

- Instalação de ferramentas essenciais
- Configuração de firewall (UFW)
- Instalação e configuração do Docker
- Criação de usuário da aplicação
- Configuração de diretórios
- Clone do repositório
- Configuração do ambiente
- Criação de cliente
- Deploy automático da aplicação

## 🚀 Como Usar

### Pré-requisitos

- **Sistema Operacional**: Ubuntu 20.04 LTS ou superior
- **Acesso**: Root ou sudo
- **Conectividade**: Internet para download de pacotes
- **Domínio**: Configurado no DNS (opcional, para SSL)

### Execução

```bash
# 1. Tornar executável
chmod +x scripts/deploy-vps.sh

# 2. Executar como root (OBRIGATÓRIO)
sudo ./scripts/deploy-vps.sh

# OU mudar para root primeiro
sudo su
./scripts/deploy-vps.sh
```

### ⚠️ IMPORTANTE

- **DEVE ser executado como root**
- O script criará um usuário 'quiosque' automaticamente
- Configure o arquivo .env após a execução
- Ajuste as portas se necessário

## 🔧 Funcionalidades

### 1. Instalação de Ferramentas
- **curl, wget, git**: Para download e controle de versão
- **ufw**: Firewall uncomplicated
- **fail2ban**: Proteção contra ataques
- **htop**: Monitoramento do sistema
- **nginx**: Servidor web (para reverse proxy)
- **certbot**: Certificados SSL automáticos
- **logrotate**: Rotação de logs

### 2. Configuração de Segurança
- **Firewall UFW**: Configurado com regras básicas
- **Portas abertas**: SSH (22), HTTP (80), HTTPS (443)
- **Fail2Ban**: Proteção contra ataques de força bruta

### 3. Docker
- **Instalação**: Versão mais recente do repositório oficial
- **Configuração**: Iniciado e habilitado automaticamente
- **Usuário**: Adicionado ao grupo docker

### 4. Estrutura de Diretórios
```
/opt/quiosque/
├── Quiosque/          # Código da aplicação
├── logs/              # Logs da aplicação
├── backups/           # Backups automáticos
└── ssl/               # Certificados SSL
```

### 5. Usuário da Aplicação
- **Nome**: quiosque
- **Permissões**: sudo sem senha
- **Grupos**: docker, sudo
- **Shell**: bash

## 📁 Arquivos Criados

### Estrutura Final
```
/opt/quiosque/
├── Quiosque/                    # Repositório clonado
│   ├── .env                     # Configurações (criar manualmente)
│   ├── docker-compose.*.yml     # Docker Compose do cliente
│   └── create-and-deploy.sh     # Script de criação de clientes
├── logs/                        # Logs da aplicação
├── backups/                     # Backups
└── ssl/                         # Certificados SSL
```

## ⚙️ Configuração Pós-Deploy

### 1. Configurar Variáveis de Ambiente
```bash
cd /opt/quiosque/Quiosque
cp env.prod.example .env
nano .env
```

### 2. Ajustar Configurações Importantes
```bash
# No arquivo .env
CLIENT_NAME=Meu Restaurante
CLIENT_ID=meurestaurante
POSTGRES_PASSWORD=senha_segura
SECRET_KEY=chave_secreta_gerada
CORS_ORIGINS=https://seudominio.com
VITE_API_BASE_URL=https://seudominio.com
```

### 3. Criar Cliente
```bash
cd /opt/quiosque/Quiosque
./create-and-deploy.sh -n "Meu Restaurante" -i "meurestaurante"
```

## 🌐 Configuração de Domínio

### 1. DNS
- Configure o domínio para apontar para o IP da VPS
- Configure subdomínios se necessário (api.seudominio.com)

### 2. Nginx Reverse Proxy
```bash
# Criar configuração do Nginx
sudo nano /etc/nginx/sites-available/quiosque

# Habilitar site
sudo ln -s /etc/nginx/sites-available/quiosque /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL com Certbot
```bash
# Gerar certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### Comandos Úteis
```bash
# Ver status dos containers
docker ps

# Ver logs de um serviço
docker logs quiosque_backend_meurestaurante

# Ver logs do docker-compose
cd /opt/quiosque/Quiosque
docker-compose -f docker-compose.meurestaurante.yml logs -f

# Ver uso de recursos
htop
df -h
free -h
```

### Logs
- **Aplicação**: `/opt/quiosque/logs/`
- **Docker**: `docker logs <container>`
- **Sistema**: `/var/log/`

## 🔒 Segurança

### Firewall
- **SSH**: Porta 22 (apenas de IPs confiáveis)
- **HTTP**: Porta 80 (redireciona para HTTPS)
- **HTTPS**: Porta 443
- **Outras portas**: Bloqueadas por padrão

### Usuários
- **root**: Acesso direto desabilitado
- **quiosque**: Usuário da aplicação com sudo
- **Docker**: Executado como usuário não-root

### Certificados
- **SSL**: Let's Encrypt (gratuito)
- **Renovação**: Automática via cron
- **HSTS**: Configurado no Nginx

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Docker não inicia
```bash
# Verificar status
sudo systemctl status docker

# Reiniciar serviço
sudo systemctl restart docker

# Verificar logs
sudo journalctl -u docker
```

#### 2. Portas em uso
```bash
# Verificar portas ocupadas
sudo netstat -tlnp

# Parar serviços conflitantes
sudo systemctl stop nginx  # se conflitar com frontend
```

#### 3. Permissões de arquivo
```bash
# Corrigir permissões
sudo chown -R quiosque:quiosque /opt/quiosque
sudo chmod -R 755 /opt/quiosque
```

#### 4. Banco de dados não conecta
```bash
# Verificar status do PostgreSQL
docker exec -it quiosque_postgres_meurestaurante pg_isready

# Verificar logs
docker logs quiosque_backend_meurestaurante
```

## 📚 Recursos Adicionais

### Documentação
- **README.md**: Documentação principal do projeto
- **API Docs**: http://localhost:8000/docs (após deploy)

### Scripts Relacionados
- **create-and-deploy.sh**: Criação de clientes
- **Docker Compose**: Gerenciamento de serviços

### Suporte
- **Issues**: GitHub do projeto
- **Logs**: Verificar logs dos containers
- **Status**: Comandos docker e docker-compose

## 🎯 Checklist de Deploy

- [ ] Script executado como root
- [ ] Todas as ferramentas instaladas
- [ ] Firewall configurado
- [ ] Docker funcionando
- [ ] Usuário quiosque criado
- [ ] Repositório clonado
- [ ] Arquivo .env configurado
- [ ] Cliente criado
- [ ] Aplicação rodando
- [ ] Domínio configurado (opcional)
- **SSL configurado (opcional)
- [ ] Backup configurado (opcional)
- [ ] Monitoramento configurado (opcional)

---

**🎉 Sistema pronto para produção após completar o checklist!**
