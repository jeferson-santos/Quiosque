# Sistema de Quiosque - FastAPI + React

Sistema completo de gerenciamento de pedidos para restaurantes e quiosques, com backend em FastAPI e frontend em React.

## 🚀 **Funcionalidades Principais**

### **Backend (FastAPI)**
- ✅ **Configuração automática** de banco de dados
- ✅ **Usuário admin padrão** criado automaticamente
- ✅ **API REST** completa para todas as operações
- ✅ **Autenticação JWT** com roles (Admin, Waiter)
- ✅ **Banco PostgreSQL** com migrações automáticas
- ✅ **Cache Redis** para performance
- ✅ **Logs estruturados** em JSON

### **Frontend (React + TypeScript)**
- ✅ **Interface moderna** com Material-UI
- ✅ **Responsivo** para desktop e mobile
- ✅ **Gerenciamento de mesas** e pedidos
- ✅ **Sistema de impressão** em fila
- ✅ **Relatórios** e dashboards
- ✅ **Gerenciamento de usuários** e permissões

## 🛠️ **Tecnologias**

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend**: React 19, TypeScript, Material-UI, Vite
- **Infraestrutura**: Docker, Docker Compose
- **Automação**: Script unificado para criação e deploy automático

## 📋 **Pré-requisitos**

- Docker e Docker Compose
- PowerShell (Windows) ou Bash (Linux/Mac)
- Git

## 🚀 **Início Rápido**

### **1. Clone o repositório**
```bash
git clone <seu-repositorio>
cd Quiosque
```

### **2. Criar cliente e fazer deploy automaticamente**
```bash
# Linux/Mac
./create-and-deploy.sh -n "Meu Restaurante" -i "restaurante1"

# Com opções adicionais
./create-and-deploy.sh \
  -n "Meu Restaurante" \
  -i "restaurante1" \
  -d "meurestaurante.com" \
  -r "Meu Restaurante Ltda"
```

### **3. Para deploy em VPS Ubuntu (ARQUITETURA LIMPA!)**
```bash
# Setup COMPLETO da VPS (domínio principal + SSL)
sudo ./scripts/setup-vps.sh -d meudominio.com -e admin@meudominio.com

# Depois apenas criar clientes (cada um com seu próprio subdomain)
./create-and-deploy.sh -n "Meu Restaurante" -i "restaurante1" -d "meudominio.com"
```

### **4. Acessar o sistema**
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs
- **Credenciais padrão**: `admin` / `admin123`

**Nota**: Todas as configurações (backend e frontend) estão centralizadas em um único arquivo `env.prod.<client_id>`

## 🖥️ **Deploy em VPS Ubuntu (Passo a Passo)**

### **📋 Pré-requisitos da VPS**
- **Sistema**: Ubuntu 20.04+ (recomendado 22.04 LTS)
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 20GB (recomendado 40GB+)
- **Domínio**: Aponte A record para IP da VPS
- **Acesso**: Root ou sudo

### **🚀 Passo 1: Preparar a VPS**
```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y git curl wget
```

### **📥 Passo 2: Clonar o projeto**
```bash
# Clonar repositório
git clone https://github.com/jeferson-santos/quiosque.git /home/quiosque
cd /home/quiosque

# Dar permissões de execução
chmod +x *.sh scripts/*.sh
```

### **⚙️ Passo 3: Configurar VPS para PRODUÇÃO (Docker + Traefik + Portainer + SSL)**
```bash
# Executar setup COMPLETO da VPS para PRODUÇÃO
sudo ./scripts/setup-vps.sh -d SEU_DOMINIO.com -e SEU_EMAIL@exemplo.com

# Exemplo:
sudo ./scripts/setup-vps.sh -d psicomariaantonia.com.br -e admin@psicomariaantonia.com.br

# Para teste (staging):
sudo ./scripts/setup-vps.sh -d SEU_DOMINIO.com -e SEU_EMAIL@exemplo.com -t
```

**O que o setup-vps.sh faz (OTIMIZADO PARA PRODUÇÃO):**
- ✅ **Docker**: Instala e configura
- ✅ **Traefik**: Proxy reverso moderno com SSL automático
- ✅ **Portainer**: Interface web para gerenciar containers
- ✅ **Nginx**: Configurado para domínio principal
- ✅ **SSL**: Let's Encrypt automático para todos os domínios
- ✅ **Firewall**: UFW configurado
- ✅ **Backup**: Sistema automático
- ✅ **Monitoramento**: Logs e health checks
- ✅ **Segurança**: Fail2ban e configurações de segurança

### **🌐 Passo 4: Verificar configuração da VPS para PRODUÇÃO**
```bash
# Testar Nginx
sudo nginx -t

# Verificar status dos serviços
sudo systemctl status nginx
sudo systemctl status docker

# Verificar containers Traefik e Portainer
docker ps

# Acessar domínio principal
curl -I https://SEU_DOMINIO.com

# Acessar Portainer (interface web)
curl -I https://portainer.SEU_DOMINIO.com

# Acessar Traefik Dashboard
curl -I https://traefik.SEU_DOMINIO.com
```

### **👥 Passo 5: Criar clientes (subdomains)**
```bash
# Criar primeiro cliente
./create-and-deploy.sh -n "Restaurante A" -i "restaurante_a" -d "SEU_DOMINIO.com" -e "admin@exemplo.com"

# Criar segundo cliente
./create-and-deploy.sh -n "Restaurante B" -i "restaurante_b" -d "SEU_DOMINIO.com" -e "admin@exemplo.com"
```

**O que o create-and-deploy.sh faz:**
- ✅ **Docker**: Containers com portas automáticas
- ✅ **Traefik**: Configuração automática de proxy reverso
- ✅ **SSL**: Certificado automático via Let's Encrypt
- ✅ **Banco**: PostgreSQL isolado por cliente
- ✅ **Cache**: Redis isolado por cliente
- ✅ **Subdomínios**: Configurados automaticamente no Traefik

### **🔍 Passo 6: Verificar funcionamento**
```bash
# Listar containers
docker ps

# Verificar configurações do Traefik
docker logs traefik

# Verificar configurações do Portainer
docker logs portainer

# Testar subdomains (agora via HTTPS)
curl -I https://restaurante_a.SEU_DOMINIO.com
curl -I https://restaurante_b.SEU_DOMINIO.com

# Acessar Portainer via web
# https://portainer.SEU_DOMINIO.com
```

## 🔧 **Configuração Automática**

O sistema **não requer configuração manual**:

1. **Banco de dados**: Tabelas criadas automaticamente
2. **Usuário admin**: Criado automaticamente (`admin` / `admin123`)
3. **Configurações**: Geradas automaticamente para cada cliente
4. **Networks Docker**: Isolados por cliente
5. **Traefik**: Proxy reverso configurado automaticamente para todos os subdomínios
6. **SSL**: Let's Encrypt configurado automaticamente para todos os domínios
7. **Portainer**: Interface web para gerenciar containers automaticamente configurada

## 📁 **Estrutura do Projeto**

```
Quiosque/
├── backend/                 # API FastAPI
│   ├── app/                # Código da aplicação
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile         # Container do backend
├── frontend/               # Interface React
│   ├── src/                # Código fonte
│   ├── package.json        # Dependências Node.js
│   └── Dockerfile         # Container do frontend
├── scripts/                 # Scripts de automação
│   ├── setup-vps.sh         # Script COMPLETO para VPS Ubuntu (arquitetura limpa)
│   ├── deploy-subdomain.sh  # Script para configurar subdomínios específicos
│   └── cleanup-vps.sh       # Script para limpeza completa da VPS
├── create-and-deploy.sh    # Script unificado para criação e deploy
├── docker-compose.example.yml  # Exemplo de configuração
└── env.prod.example       # Template de ambiente (backend + frontend)
```

## 🎯 **Criação de Clientes**

### **Comando Completo**
```bash
./create-and-deploy.sh \
  -n "Restaurante Exemplo" \
  -i "exemplo" \
  -d "exemplo.com" \
  -r "Restaurante Exemplo Ltda"
```

### **Parâmetros**
- `-n, --name`: Nome completo do cliente
- `-i, --id`: ID único (sem espaços)
- `-d, --domain`: Domínio do cliente (opcional)
- `-r, --restaurant`: Nome do restaurante (opcional)

### **Arquivos Gerados**
- `.env` - Configurações do cliente
- `docker-compose.<client_id>.yml` - Docker Compose
- **Deploy automático** - Não precisa de script separado

## 🌐 **Arquitetura do Nginx (NOVA!)**

### **🏗️ Estrutura de Arquivos**
```bash
/etc/nginx/sites-available/
├── default                           # Domínio principal (setup-vps.sh)
├── cliente1.SEU_DOMINIO.com         # Cliente 1 (create-and-deploy.sh)
├── cliente2.SEU_DOMINIO.com         # Cliente 2 (create-and-deploy.sh)
└── cliente3.SEU_DOMINIO.com         # Cliente 3 (create-and-deploy.sh)

/etc/nginx/sites-enabled/
├── default -> ../sites-available/default
├── cliente1.SEU_DOMINIO.com -> ../sites-available/cliente1.SEU_DOMINIO.com
└── ...
```

### **🎯 Vantagens da Nova Arquitetura**
- ✅ **Arquivos separados** - Um por subdomain
- ✅ **Zero conflitos** - Cada cliente isolado
- ✅ **Manutenção fácil** - Editar/remover individualmente
- ✅ **Padrão Nginx** - sites-available/sites-enabled
- ✅ **SSL individual** - Certificado por subdomain
- ✅ **Logs separados** - Por cliente

### **🔧 Portas Automáticas**
- **Frontend**: Porta escolhida automaticamente pelo Docker
- **Backend**: Porta escolhida automaticamente pelo Docker
- **PostgreSQL**: Porta escolhida automaticamente pelo Docker
- **Redis**: Porta escolhida automaticamente pelo Docker

*Docker gerencia portas automaticamente - zero conflitos!*

## 🔒 **Segurança**

- **Senhas fortes** geradas automaticamente
- **Chaves secretas** únicas por cliente
- **Networks Docker** isolados
- **CORS configurado** por domínio
- **Autenticação JWT** com expiração

## 📊 **Monitoramento**

- **Health checks** automáticos
- **Logs estruturados** em JSON
- **Métricas** de performance
- **Status dos serviços** via Docker

## 🚀 **Deploy em Produção**

### **1. Deploy Local (Desenvolvimento)**
```bash
# Cria cliente e faz deploy automaticamente
./create-and-deploy.sh -n "Meu Restaurante" -i "meurestaurante"
```

### **2. Deploy em VPS Ubuntu (Produção)**
```bash
# Setup COMPLETO da VPS (tudo em um!)
sudo ./scripts/setup-vps.sh -d meudominio.com -e admin@meudominio.com
```

### **3. Configurar domínio e SSL**
```bash
# Editar .env
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
VITE_API_BASE_URL=https://api.seudominio.com
```

## 🐛 **Troubleshooting**

### **Backend não conecta ao banco**
```bash
# Verificar variáveis de ambiente
docker exec -it quiosque_backend_<client_id> env | grep POSTGRES

# Verificar logs
docker logs quiosque_backend_<client_id>

# Verificar se PostgreSQL está saudável
docker exec -it quiosque_postgres_<client_id> pg_isready
```

### **Frontend não carrega**
```bash
# Verificar build
docker logs quiosque_frontend_<client_id>

# Verificar configuração da API
docker exec -it quiosque_frontend_<client_id> env | grep VITE
```

### **Portas em uso**
```bash
# Verificar portas ocupadas
netstat -an | findstr :8000
netstat -an | findstr :80

# Alterar portas no docker-compose
BACKEND_PORT=8001
FRONTEND_PORT=8080
```

## 📚 **Documentação da API**

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 **Suporte**

- **Issues**: Abra uma issue no GitHub
- **Documentação**: Consulte a API docs
- **Logs**: Verifique os logs dos containers

---

**🎉 Sistema 100% automatizado e pronto para produção!**