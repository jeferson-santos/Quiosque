# 🚀 Guia de Configuração de Clientes em Produção

Este guia explica como configurar e fazer deploy do sistema para novos clientes em produção.

## 🎯 **Visão Geral**

Para cada cliente, você terá:
- 📁 **Arquivo de configuração** (`env.prod.CLIENT_ID`)
- 🐳 **Docker-compose específico** (`docker-compose.CLIENT_ID.yml`)
- 📜 **Script de deploy** (`scripts/deploy-CLIENT_ID.ps1`)
- 🗄️ **Banco de dados isolado** (PostgreSQL + Redis)
- 🌐 **Frontend e Backend** rodando em containers separados

## 🆕 **1. CONFIGURANDO NOVO CLIENTE**

### **Comando para criar configuração:**
```powershell
# No diretório raiz do projeto
.\scripts\setup-client.ps1 -ClientName "Restaurante Exemplo" -ClientId "cliente_001" -Domain "exemplo.com"
```

### **Parâmetros disponíveis:**
- `-ClientName`: Nome do restaurante/cliente
- `-ClientId`: ID único do cliente (ex: cliente_001, restaurante_abc)
- `-Domain`: Domínio principal do cliente
- `-SecretKey`: Chave JWT (opcional - será gerada automaticamente)
- `-DbPassword`: Senha do banco (opcional - será gerada automaticamente)
- `-RedisPassword`: Senha do Redis (opcional - será gerada automaticamente)

### **Exemplo completo:**
```powershell
.\scripts\setup-client.ps1 `
    -ClientName "Restaurante Sabor Brasileiro" `
    -ClientId "sabor_brasileiro" `
    -Domain "saborbrasileiro.com.br" `
    -SecretKey "minha-chave-super-secreta-2024" `
    -DbPassword "senha-banco-123" `
    -RedisPassword "senha-redis-456"
```

## 🔧 **2. ARQUIVOS CRIADOS**

Após executar o script, você terá:

### **📁 Configuração do Cliente:**
```
env.prod.CLIENT_ID          # Configurações específicas
```

### **🐳 Docker Compose:**
```
docker-compose.CLIENT_ID.yml # Serviços isolados
```

### **📜 Script de Deploy:**
```
scripts/deploy-CLIENT_ID.ps1 # Deploy automatizado
```

### **📁 Diretórios:**
```
logs/CLIENT_ID/             # Logs específicos
backup/CLIENT_ID/           # Backups do banco
```

## 🚀 **3. FAZENDO DEPLOY**

### **Deploy automático:**
```powershell
# Executar o script de deploy específico
.\scripts\deploy-CLIENT_ID.ps1
```

### **Deploy manual:**
```powershell
# Build das imagens
docker-compose -f docker-compose.CLIENT_ID.yml build --no-cache

# Iniciar serviços
docker-compose -f docker-compose.CLIENT_ID.yml up -d

# Verificar status
docker-compose -f docker-compose.CLIENT_ID.yml ps
```

## ⚙️ **4. CONFIGURAÇÕES ESPECÍFICAS**

### **🔑 Segurança:**
```bash
# Chave JWT única por cliente
SECRET_KEY=chave-unica-cliente-001-2024

# Configurações de CORS
CORS_ORIGINS=https://cliente001.com,https://www.cliente001.com
```

### **🏢 Negócio:**
```bash
# Nome e informações do restaurante
RESTAURANT_NAME=Restaurante Sabor Brasileiro
RESTAURANT_ADDRESS=Rua das Flores, 123
RESTAURANT_PHONE=(11) 99999-9999
RESTAURANT_EMAIL=contato@saborbrasileiro.com.br
```

### **🎛️ Funcionalidades (Feature Flags):**
```bash
# Habilitar/desabilitar módulos
VITE_ENABLE_ROOMS=true          # Sistema de quartos
VITE_ENABLE_TABLES=true         # Sistema de mesas
VITE_ENABLE_ORDERS=true         # Sistema de pedidos
VITE_ENABLE_PAYMENTS=true       # Sistema de pagamentos
VITE_ENABLE_REPORTS=true        # Relatórios
VITE_ENABLE_PRINT_QUEUES=true   # Filas de impressão

# Limites por funcionalidade
VITE_MAX_ROOMS=50               # Máximo de quartos
VITE_MAX_TABLES_PER_ROOM=20     # Máximo de mesas por quarto
VITE_MAX_PRODUCTS_PER_CATEGORY=100 # Máximo de produtos por categoria
```

## 📊 **5. MONITORAMENTO E MANUTENÇÃO**

### **Verificar status:**
```powershell
# Status dos serviços
docker-compose -f docker-compose.CLIENT_ID.yml ps

# Logs em tempo real
docker-compose -f docker-compose.CLIENT_ID.yml logs -f backend
docker-compose -f docker-compose.CLIENT_ID.yml logs -f frontend
```

### **Backup e restauração:**
```powershell
# Backup do banco
docker exec quiosque_postgres_CLIENT_ID pg_dump -U quiosque_CLIENT_ID quiosque_CLIENT_ID > backup_CLIENT_ID.sql

# Restaurar backup
docker exec -i quiosque_postgres_CLIENT_ID psql -U quiosque_CLIENT_ID quiosque_CLIENT_ID < backup_CLIENT_ID.sql
```

### **Reiniciar serviços:**
```powershell
# Reiniciar serviço específico
docker-compose -f docker-compose.CLIENT_ID.yml restart backend

# Reiniciar todos os serviços
docker-compose -f docker-compose.CLIENT_ID.yml restart
```

## 🔄 **6. ATUALIZAÇÕES E UPGRADES**

### **Atualizar código:**
```powershell
# 1. Fazer pull das mudanças
git pull origin main

# 2. Rebuild das imagens
docker-compose -f docker-compose.CLIENT_ID.yml build --no-cache

# 3. Reiniciar serviços
docker-compose -f docker-compose.CLIENT_ID.yml up -d
```

### **Executar migrações:**
```powershell
# Executar migrações do banco
docker-compose -f docker-compose.CLIENT_ID.yml exec backend poetry run alembic upgrade head
```

## 🚨 **7. TROUBLESHOOTING**

### **Problemas comuns:**

#### **Porta já em uso:**
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :8000

# Parar todos os serviços
docker-compose -f docker-compose.CLIENT_ID.yml down
```

#### **Banco não conecta:**
```powershell
# Verificar logs do PostgreSQL
docker-compose -f docker-compose.CLIENT_ID.yml logs postgres_CLIENT_ID

# Testar conexão
docker exec quiosque_postgres_CLIENT_ID psql -U quiosque_CLIENT_ID -d quiosque_CLIENT_ID -c "SELECT 1"
```

#### **Frontend não carrega:**
```powershell
# Verificar logs do frontend
docker-compose -f docker-compose.CLIENT_ID.yml logs frontend_CLIENT_ID

# Verificar se o build foi bem-sucedido
docker-compose -f docker-compose.CLIENT_ID.yml exec frontend_CLIENT_ID ls -la /usr/share/nginx/html
```

## 📋 **8. CHECKLIST DE DEPLOY**

### **Antes do deploy:**
- [ ] ✅ Configuração do cliente criada (`env.prod.CLIENT_ID`)
- [ ] ✅ Docker-compose específico criado
- [ ] ✅ Script de deploy criado
- [ ] ✅ Domínio configurado (se aplicável)
- [ ] ✅ SSL configurado (se aplicável)

### **Durante o deploy:**
- [ ] ✅ Build das imagens bem-sucedido
- [ ] ✅ Serviços iniciando corretamente
- [ ] ✅ Banco de dados conectando
- [ ] ✅ Health checks passando
- [ ] ✅ Frontend acessível

### **Após o deploy:**
- [ ] ✅ Funcionalidades testadas
- [ ] ✅ Usuários criados (admin/waiter)
- [ ] ✅ Dados iniciais carregados
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoramento ativo

## 💡 **9. DICAS IMPORTANTES**

### **🔒 Segurança:**
- **NUNCA** commite arquivos `env.prod.*` no Git
- **SEMPRE** use senhas fortes e únicas por cliente
- **SEMPRE** configure firewall no servidor
- **SEMPRE** faça backup antes de atualizações

### **🚀 Performance:**
- **Isolamento:** Cada cliente tem seus próprios containers
- **Recursos:** Configure limites de CPU/RAM por cliente
- **Backup:** Backup automático configurado por cliente
- **Monitoramento:** Logs e métricas separados por cliente

### **🔄 Manutenção:**
- **Updates:** Atualize todos os clientes simultaneamente
- **Backup:** Mantenha histórico de backups
- **Logs:** Monitore logs de todos os clientes
- **Health:** Configure alertas de saúde dos serviços

## 🎉 **10. EXEMPLO PRÁTICO**

### **Configurando cliente "Restaurante ABC":**

```powershell
# 1. Criar configuração
.\scripts\setup-client.ps1 -ClientName "Restaurante ABC" -ClientId "abc" -Domain "restauranteabc.com.br"

# 2. Revisar configuração
notepad env.prod.abc

# 3. Fazer deploy
.\scripts\deploy-abc.ps1

# 4. Verificar status
docker-compose -f docker-compose.abc.yml ps

# 5. Acessar sistema
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### **Resultado:**
- 🌐 **Frontend:** http://localhost (Restaurante ABC)
- 🔧 **Backend:** http://localhost:8000
- 🗄️ **Banco:** PostgreSQL isolado para cliente ABC
- 🔴 **Cache:** Redis isolado para cliente ABC
- 📝 **Logs:** Separados em `logs/abc/`
- 💾 **Backup:** Automático em `backup/abc/`

---

**Lembre-se:** Cada cliente é completamente isolado, com suas próprias configurações, banco de dados e recursos! 🎯
