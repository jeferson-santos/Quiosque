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
- **Automação**: Scripts PowerShell/Bash para criação de clientes

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

### **2. Criar um novo cliente**
```powershell
# Windows
.\scripts\create-client.ps1 -ClientName "Meu Restaurante" -ClientId "restaurante1" -Domain "meurestaurante.com"

# Linux/Mac
./scripts/create-client.sh "Meu Restaurante" "restaurante1" "meurestaurante.com"
```

### **3. Deploy automático**
```powershell
# Windows
.\deploy-restaurante1.ps1

# Linux/Mac
docker-compose -f docker-compose.restaurante1.yml up -d
```

### **4. Acessar o sistema**
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs
- **Credenciais padrão**: `admin` / `admin123`

**Nota**: Todas as configurações (backend e frontend) estão centralizadas em um único arquivo `env.prod.<client_id>`

## 🔧 **Configuração Automática**

O sistema **não requer configuração manual**:

1. **Banco de dados**: Tabelas criadas automaticamente
2. **Usuário admin**: Criado automaticamente (`admin` / `admin123`)
3. **Configurações**: Geradas automaticamente para cada cliente
4. **Networks Docker**: Isolados por cliente

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
├── scripts/                # Scripts de automação
│   ├── create-client.ps1  # Criação de clientes (Windows)
│   └── create-client.sh   # Criação de clientes (Linux/Mac)
├── docker-compose.example.yml  # Exemplo de configuração
└── env.prod.example       # Template de ambiente (backend + frontend)
```

## 🎯 **Criação de Clientes**

### **Comando Completo**
```powershell
.\scripts\create-client.ps1 `
  -ClientName "Restaurante Exemplo" `
  -ClientId "exemplo" `
  -Domain "exemplo.com" `
  -RestaurantName "Restaurante Exemplo Ltda" `
  -SkipConfirmation
```

### **Parâmetros**
- `ClientName`: Nome completo do cliente
- `ClientId`: ID único (sem espaços)
- `Domain`: Domínio do cliente
- `RestaurantName`: Nome do restaurante
- `SkipConfirmation`: Pular confirmação

### **Arquivos Gerados**
- `env.prod.<client_id>` - Configurações do cliente
- `docker-compose.<client_id>.yml` - Docker Compose
- `deploy-<client_id>.ps1` - Script de deploy
- `README-<client_id>.md` - Documentação específica

## 🌐 **Portas Padrão**

- **Frontend**: 80
- **Backend**: 8000
- **PostgreSQL**: 5432
- **Redis**: 6379

*Cada cliente usa portas diferentes para evitar conflitos*

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

### **1. Configurar domínio**
```bash
# Editar env.prod.<client_id>
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

### **2. Configurar SSL (opcional)**
```bash
# Adicionar certificados no nginx
SSL_CERT_FILE=/etc/nginx/ssl/cert.pem
SSL_KEY_FILE=/etc/nginx/ssl/key.pem
```

### **3. Deploy**
```bash
./deploy-<client_id>.ps1
```

## 🐛 **Troubleshooting**

### **Backend não conecta ao banco**
```bash
# Verificar variáveis de ambiente
docker exec -it quiosque_backend_<client_id> env | grep POSTGRES

# Verificar logs
docker logs quiosque_backend_<client_id>
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