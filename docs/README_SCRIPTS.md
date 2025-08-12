# 📜 Scripts de Deploy - Instruções de Uso

## 🐧 Scripts para Linux/Ubuntu

### 📋 deploy-vps-example.sh

**Descrição**: Script automatizado para deploy completo em VPS Ubuntu

**Como usar**:
```bash
# 1. Tornar executável
chmod +x docs/deploy-vps-example.sh

# 2. Executar (NÃO como root)
./docs/deploy-vps-example.sh
```

**⚠️ IMPORTANTE**: 
- Execute como usuário normal, NÃO como root
- O script criará um usuário 'quiosque' automaticamente
- Configure o arquivo .env após a execução

**Funcionalidades**:
- ✅ Instalação automática do Docker
- ✅ Configuração de firewall (UFW)
- ✅ Instalação de ferramentas essenciais
- ✅ Configuração de segurança (fail2ban)
- ✅ Criação de usuário da aplicação
- ✅ Clone do repositório
- ✅ Configuração inicial do ambiente
- ✅ Criação de cliente de exemplo
- ✅ Deploy da aplicação
- ✅ Verificação de status

## 🪟 Scripts para Windows

### 📋 create-client.ps1

**Descrição**: Script PowerShell para criar novos clientes

**Como usar**:
```powershell
# Executar no PowerShell
.\scripts\create-client.ps1
```

**Funcionalidades**:
- ✅ Criação de arquivo .env
- ✅ Geração de docker-compose.yml
- ✅ Criação de script de deploy
- ✅ Configuração de variáveis de ambiente

## 🔧 Scripts para Ambos OS

### 📋 create-client.sh

**Descrição**: Script Bash para criar novos clientes

**Como usar**:
```bash
# Executar no terminal
./scripts/create-client.sh
```

**Funcionalidades**:
- ✅ Mesmas funcionalidades do create-client.ps1
- ✅ Compatível com Linux/Mac

## 📚 Documentação Relacionada

- **Deploy em VPS**: [DEPLOY_VPS_UBUNTU.md](./DEPLOY_VPS_UBUNTU.md)
- **README Principal**: [README.md](./README.md)

## 🚀 Fluxo de Deploy Recomendado

### 1. **Desenvolvimento Local**
```bash
# Usar scripts create-client.* para criar ambiente
./scripts/create-client.sh --client-name "Meu Restaurante" --client-id "meurestaurante"
```

### 2. **Deploy em VPS Ubuntu**
```bash
# Usar script automatizado
./docs/deploy-vps-example.sh

# Ou seguir manualmente o guia
# docs/DEPLOY_VPS_UBUNTU.md
```

### 3. **Configuração Pós-Deploy**
- Editar arquivo .env com configurações reais
- Configurar DNS e domínio
- Configurar SSL/HTTPS
- Configurar backups automáticos

## 🔒 Segurança

**⚠️ IMPORTANTE**: 
- NUNCA commitar arquivos .env no Git
- Sempre alterar senhas padrão
- Configurar firewall adequadamente
- Usar HTTPS em produção
- Configurar fail2ban para proteção SSH

## 📞 Suporte

Para dúvidas sobre os scripts:
1. Verifique os logs de execução
2. Consulte a documentação relacionada
3. Verifique se todas as dependências estão instaladas
4. Execute com `--help` para ver opções disponíveis

---

**🎯 Dica**: Comece sempre com o script de exemplo para entender o processo completo!
