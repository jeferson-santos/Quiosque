# 🚀 Scripts de Inicialização do Ambiente de Desenvolvimento

Este diretório contém scripts para configurar rapidamente o ambiente de desenvolvimento do Sistema de Quiosque.

## 📋 Scripts Disponíveis

### 🐍 Scripts Python

#### `quick_dev_setup.py` (Recomendado)
Script simplificado e rápido para inicialização básica:
- ✅ Verifica conexão com PostgreSQL
- ✅ Cria usuários padrão (admin/admin123, waiter/waiter123)
- ✅ Carrega dados básicos (categorias e produtos)
- ✅ Verifica se tudo está funcionando

**Uso:**
```bash
cd backend
poetry run python scripts/quick_dev_setup.py
```

#### `dev_setup.py`
Script completo que executa todos os seeds disponíveis:
- ✅ Verifica conexão com PostgreSQL
- ✅ Verifica migrações
- ✅ Cria usuários padrão
- ✅ Executa todos os scripts de seed (quartos, mesas, categorias, produtos, pedidos)
- ⚠️ Pode ter problemas com caracteres Unicode no Windows

**Uso:**
```bash
cd backend
poetry run python scripts/dev_setup.py
```

### 🐚 Scripts de Shell

#### `dev_setup.sh` (Linux/Mac)
Script bash completo que:
- 🐳 Inicia serviços Docker (PostgreSQL + Redis)
- 🐍 Executa o setup Python
- 📋 Fornece instruções completas

**Uso:**
```bash
chmod +x backend/scripts/dev_setup.sh
./backend/scripts/dev_setup.sh
```

#### `dev_setup.ps1` (Windows)
Script PowerShell equivalente ao bash:
- 🐳 Inicia serviços Docker
- 🐍 Executa o setup Python
- 🎨 Interface colorida no PowerShell

**Uso:**
```powershell
.\backend\scripts\dev_setup.ps1
```

## 🚀 Inicialização Rápida

### 1. Iniciar Serviços Docker
```bash
docker-compose up -d
```

### 2. Executar Setup Python
```bash
cd backend
poetry run python scripts/quick_dev_setup.py
```

### 3. Iniciar Sistema
```bash
# Terminal 1 - Backend
cd backend
poetry run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🔑 Credenciais Padrão

Após executar os scripts, você terá acesso com:

- **👑 Administrador:** `admin` / `admin123`
- **👨‍💼 Garçom:** `waiter` / `waiter123`

## 🌐 URLs de Acesso

- **📱 Frontend:** http://localhost:5173
- **🔧 Backend:** http://localhost:8000
- **📚 API Docs:** http://localhost:8000/docs

## 📊 Dados Carregados

### Usuários
- 1 Administrador
- 1 Garçom

### Categorias
- Bebidas
- Petiscos  
- Frutos do Mar
- Crepes
- Sobremesas

### Produtos
- Coca-Cola (R$ 8,50)
- Água (R$ 5,00)
- Batata Frita (R$ 15,00)
- Crepe de Chocolate (R$ 18,00)

## 🛠️ Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar serviços
docker-compose down
docker-compose up -d
```

### Erro de Dependências
```bash
cd backend
poetry install
```

### Erro de Migrações
```bash
cd backend
poetry run alembic upgrade head
```

### Limpar Banco e Recomeçar
```bash
# Parar serviços
docker-compose down

# Remover volume do banco
docker volume rm quiosque_postgres_data

# Reiniciar e executar setup
docker-compose up -d
cd backend
poetry run python scripts/quick_dev_setup.py
```

## 📝 Personalização

Para adicionar mais dados de desenvolvimento, edite o arquivo `quick_dev_setup.py` na função `load_basic_data()`.

## 🔄 Atualizações

Os scripts verificam se os dados já existem antes de criar novos, então podem ser executados múltiplas vezes sem problemas.
