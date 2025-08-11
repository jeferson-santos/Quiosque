# 🔄 Guia de Fluxo de Trabalho: Desenvolvimento → Produção

Este guia explica como trabalhar eficientemente entre os ambientes de desenvolvimento e produção.

## 🎯 **Visão Geral do Fluxo**

```
🖥️ DESENVOLVIMENTO → 🧪 TESTES → 🚀 PRODUÇÃO → 📊 MONITORAMENTO
```

## 🖥️ **1. AMBIENTE DE DESENVOLVIMENTO**

### **Quando usar:**
- ✅ Desenvolvendo novas funcionalidades
- ✅ Corrigindo bugs
- ✅ Testando localmente
- ✅ Trabalhando no código

### **Como ativar:**
```bash
# Linux/Mac
./scripts/switch-env.sh dev

# Windows
.\scripts\switch-env.ps1 dev
```

### **O que acontece:**
1. 🛑 Para ambiente de produção (se estiver rodando)
2. 🚀 Inicia PostgreSQL + Redis
3. 🌐 Frontend roda na porta 5173 (hot reload)
4. 🔧 Backend roda na porta 8000 (hot reload)

### **Para trabalhar:**
```bash
# Terminal 1 - Backend
cd backend
poetry run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **URLs de desenvolvimento:**
- **Frontend:** http://localhost:5173 (com hot reload)
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🧪 **2. TESTES E VALIDAÇÃO**

### **Antes de ir para produção:**
1. ✅ **Testar funcionalidades** no ambiente de dev
2. ✅ **Executar testes** automatizados
3. ✅ **Verificar banco** de dados
4. ✅ **Validar frontend** em diferentes navegadores

### **Comandos de teste:**
```bash
# Backend - Testes
cd backend
poetry run pytest

# Frontend - Testes
cd frontend
npm test

# Verificar qualidade do código
cd backend
poetry run black .
poetry run isort .
```

---

## 🚀 **3. DEPLOY EM PRODUÇÃO**

### **Quando fazer deploy:**
- 🎯 Funcionalidade estável e testada
- 🎯 Bug crítico corrigido
- 🎯 Atualização de segurança
- 🎯 Release planejado

### **Como fazer deploy:**
```bash
# Linux/Mac
./scripts/switch-env.sh prod

# Windows
.\scripts\switch-env.ps1 prod
```

### **O que acontece:**
1. 🛑 Para ambiente de desenvolvimento
2. 🔨 Build das imagens Docker
3. 🚀 Inicia serviços de produção
4. 🔄 Executa migrações do banco
5. 🌱 Carrega dados iniciais
6. ✅ Verifica health checks

### **URLs de produção:**
- **Frontend:** http://localhost (porta 80)
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📊 **4. MONITORAMENTO E MANUTENÇÃO**

### **Verificar status:**
```bash
# Ver status de todos os ambientes
./scripts/switch-env.sh status

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### **Métricas importantes:**
- 🖥️ **CPU e RAM** dos containers
- 🌐 **Latência** das APIs
- 🗄️ **Uso do banco** de dados
- 📝 **Logs de erro**

---

## 🔄 **5. FLUXO DE TRABALHO DIÁRIO**

### **🕐 Manhã - Iniciar desenvolvimento:**
```bash
# 1. Ativar ambiente de desenvolvimento
./scripts/switch-env.sh dev

# 2. Iniciar serviços
cd backend; poetry run dev
cd frontend; npm run dev

# 3. Verificar se tudo está funcionando
curl http://localhost:8000/health
```

### **🕐 Durante o dia - Desenvolvimento:**
- ✏️ **Editar código** (hot reload ativo)
- 🧪 **Testar funcionalidades** localmente
- 💾 **Commits frequentes** no Git
- 📝 **Documentar mudanças**

### **🕐 Final do dia - Preparar produção:**
```bash
# 1. Testar tudo localmente
# 2. Fazer commit final
git add .
git commit -m "feat: nova funcionalidade implementada"
git push

# 3. Verificar se está tudo funcionando
./scripts/switch-env.sh status
```

---

## 🚨 **6. SITUAÇÕES ESPECIAIS**

### **🆘 Problema em produção:**
```bash
# 1. Verificar logs
docker-compose -f docker-compose.prod.yml logs backend

# 2. Reiniciar serviço específico
docker-compose -f docker-compose.prod.yml restart backend

# 3. Se necessário, voltar para desenvolvimento
./scripts/switch-env.sh dev
```

### **🔄 Rollback rápido:**
```bash
# 1. Parar produção
docker-compose -f docker-compose.prod.yml down

# 2. Voltar para versão anterior (se tiver tag)
git checkout v1.0.0

# 3. Reativar produção
./scripts/switch-env.sh prod
```

### **🧹 Limpeza geral:**
```bash
# Limpar todos os ambientes
./scripts/switch-env.sh clean

# Recomeçar do zero
./scripts/switch-env.sh dev
```

---

## 📋 **7. CHECKLIST DE DEPLOY**

### **Antes do deploy:**
- [ ] ✅ Código testado localmente
- [ ] ✅ Testes automatizados passando
- [ ] ✅ Banco de dados estável
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Backup do banco atualizado
- [ ] ✅ Equipe notificada

### **Durante o deploy:**
- [ ] ✅ Ambiente de dev parado
- [ ] ✅ Build das imagens bem-sucedido
- [ ] ✅ Serviços iniciando corretamente
- [ ] ✅ Migrações executadas
- [ ] ✅ Health checks passando
- [ ] ✅ Frontend acessível

### **Após o deploy:**
- [ ] ✅ Funcionalidades testadas
- [ ] ✅ Performance monitorada
- [ ] ✅ Logs verificados
- [ ] ✅ Equipe confirmou funcionamento
- [ ] ✅ Documentação atualizada

---

## 🎯 **8. COMANDOS RÁPIDOS**

### **Alternar ambientes:**
```bash
./scripts/switch-env.sh dev      # Desenvolvimento
./scripts/switch-env.sh prod     # Produção
./scripts/switch-env.sh status   # Ver status
./scripts/switch-env.sh clean    # Limpar tudo
```

### **Desenvolvimento:**
```bash
# Iniciar backend
cd backend && poetry run dev

# Iniciar frontend
cd frontend && npm run dev

# Setup inicial (dados de teste)
cd backend && poetry run python scripts/quick_dev_setup.py
```

### **Produção:**
```bash
# Deploy completo
./scripts/deploy-prod.sh

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviço
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 💡 **9. DICAS IMPORTANTES**

### **🔒 Segurança:**
- **NUNCA** commitar arquivos `.env.prod`
- **SEMPRE** usar senhas fortes em produção
- **SEMPRE** configurar firewall no servidor
- **SEMPRE** fazer backup antes de atualizações

### **🚀 Performance:**
- **Desenvolvimento:** Hot reload ativo, debug ligado
- **Produção:** Otimizações ativas, cache configurado
- **Monitoramento:** Logs estruturados, métricas ativas

### **🔄 Versionamento:**
- **Commits frequentes** durante desenvolvimento
- **Tags** para releases de produção
- **Branches** para funcionalidades grandes
- **Pull requests** para revisão de código

---

## 📞 **10. SUPORTE E TROUBLESHOOTING**

### **Problemas comuns:**
1. **Porta já em uso:** `./scripts/switch-env.sh clean`
2. **Banco não conecta:** Verificar Docker e variáveis
3. **Frontend não carrega:** Verificar build e Nginx
4. **Backend com erro:** Verificar logs e dependências

### **Comandos de diagnóstico:**
```bash
# Ver status geral
./scripts/switch-env.sh status

# Ver logs de erro
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep ERROR

# Ver uso de recursos
docker stats

# Verificar rede
docker network ls
docker network inspect quiosque_quiosque_network
```

---

## 🎉 **RESUMO DO FLUXO**

```
🖥️ DESENVOLVIMENTO
├── ✏️ Editar código
├── 🧪 Testar localmente
├── 💾 Commits frequentes
└── ✅ Validar funcionalidades

🚀 PRODUÇÃO
├── 🔨 Build das imagens
├── 🚀 Deploy automatizado
├── 🔄 Migrações do banco
└── 📊 Monitoramento ativo

🔄 CICLO CONTÍNUO
├── 📝 Desenvolvimento
├── 🧪 Testes
├── 🚀 Deploy
└── 📊 Monitoramento
```

**Lembre-se:** O ambiente de desenvolvimento é para **criar**, o de produção é para **executar**! 🎯
