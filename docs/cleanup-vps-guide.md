# 🧹 Guia de Limpeza Completa da VPS

## ⚠️ **AVISO IMPORTANTE**

**Este script REMOVE TUDO da VPS!** É uma operação **IRREVERSÍVEL** que:
- 🗑️ Remove todos os containers Docker
- 🗑️ Remove todos os volumes Docker (bancos de dados)
- 🗑️ Remove todas as imagens Docker
- 🗑️ Remove todas as configurações do Nginx
- 🗑️ Remove todos os certificados SSL
- 🗑️ Remove todos os logs e arquivos

**Use apenas se tiver CERTEZA ABSOLUTA!**

## 🚀 **Como Usar:**

### **1. Limpeza Completa (Recomendado para reset total):**
```bash
sudo ./scripts/cleanup-vps.sh
```

### **2. Limpeza Forçada (sem confirmação):**
```bash
sudo ./scripts/cleanup-vps.sh -f
```

### **3. Limpar Apenas Docker:**
```bash
sudo ./scripts/cleanup-vps.sh -d
```

### **4. Limpar Apenas Nginx:**
```bash
sudo ./scripts/cleanup-vps.sh -n
```

### **5. Ver Ajuda:**
```bash
./scripts/cleanup-vps.sh -h
```

## 🔒 **Segurança:**

### **Dupla Confirmação:**
O script requer **DUAS confirmações** para executar:

1. **Primeira confirmação:** Digite `LIMPAR TUDO`
2. **Segunda confirmação:** Digite `SIM, QUERO LIMPAR`

### **Verificação de Root:**
- Script deve ser executado como **root** (`sudo`)
- Verifica permissões automaticamente

## 📋 **O que o Script Faz:**

### **🐳 Limpeza do Docker:**
- Para todos os containers
- Remove todos os containers
- Remove todos os volumes (bancos de dados!)
- Remove todas as imagens
- Remove redes customizadas
- Limpa sistema Docker

### **🌐 Limpeza do Nginx:**
- Para o serviço Nginx
- Remove todas as configurações de sites
- Restaura configuração padrão
- Remove certificados SSL
- Remove logs
- Reinicia Nginx limpo

### **🗂️ Limpeza de Arquivos:**
- Remove arquivos docker-compose
- Remove arquivos .env
- Remove logs do projeto
- Limpa diretório /home/quiosque

## 🎯 **Casos de Uso:**

### **✅ Use para:**
- 🧪 **Reset completo** da VPS
- 🚀 **Nova instalação** do zero
- 🗑️ **Limpeza de teste** após desenvolvimento
- 🔄 **Migração** para nova configuração
- 🧹 **Manutenção** de VPS com problemas

### **❌ NÃO use para:**
- 🚫 **VPS em produção** com dados importantes
- 🚫 **Limpeza parcial** (use opções -d ou -n)
- 🚫 **Manutenção regular** (use comandos específicos)
- 🚫 **Debug** de problemas (use logs e comandos específicos)

## 🚨 **Processo de Confirmação:**

```
🚨 PERIGO! PERIGO! PERIGO! 🚨
=================================

⚠️ ATENÇÃO: Este script vai REMOVER TUDO da VPS!

🔴 O que será REMOVIDO:
   • TODOS os containers Docker
   • TODOS os volumes Docker (incluindo bancos de dados!)
   • TODAS as imagens Docker
   • TODAS as redes Docker
   • TODAS as configurações do Nginx
   • TODOS os certificados SSL
   • TODOS os logs
   • TODOS os arquivos de configuração

💀 Esta operação é IRREVERSÍVEL!
💀 Todos os dados serão PERDIDOS para sempre!

📋 RESUMO: VPS voltará ao estado inicial (limpa)

❓ Você tem CERTEZA ABSOLUTA que quer continuar?
❓ Digite 'LIMPAR TUDO' para confirmar: LIMPAR TUDO

❓ ÚLTIMA CHANCE: Digite 'SIM, QUERO LIMPAR' para confirmar: SIM, QUERO LIMPAR

🚨 CONFIRMADO! Iniciando limpeza COMPLETA da VPS...
🚨 Não há volta! Todos os dados serão perdidos!
```

## 🔧 **Opções Disponíveis:**

| Opção | Descrição | Uso |
|-------|-----------|-----|
| `-f, --force` | Forçar limpeza sem confirmação | `sudo ./cleanup-vps.sh -f` |
| `-d, --docker-only` | Limpar apenas Docker | `sudo ./cleanup-vps.sh -d` |
| `-n, --nginx-only` | Limpar apenas Nginx | `sudo ./cleanup-vps.sh -n` |
| `-h, --help` | Mostrar ajuda | `./cleanup-vps.sh -h` |

## 📁 **Arquivos Afetados:**

### **Docker:**
- Containers: Todos removidos
- Volumes: Todos removidos (bancos de dados!)
- Imagens: Todas removidas
- Redes: Customizadas removidas

### **Nginx:**
- `/etc/nginx/sites-available/*` - Removido
- `/etc/nginx/sites-enabled/*` - Removido
- `/etc/letsencrypt/live/*` - Removido
- `/var/log/nginx/*.log` - Removido

### **Sistema:**
- `/home/quiosque/docker-compose.*.yml` - Removido
- `/home/quiosque/.env*` - Removido
- `/home/quiosque/logs/*` - Removido

## 🚀 **Após a Limpeza:**

### **VPS Limpa:**
- ✅ Docker funcionando (sem containers/volumes)
- ✅ Nginx funcionando (configuração padrão)
- ✅ Sistema limpo e pronto para nova instalação

### **Próximos Passos:**
1. **VPS está pronta** para nova instalação
2. **Execute o script de setup** novamente se necessário
3. **Configure novos clientes** do zero

## 🔍 **Debug e Logs:**

### **Se algo der errado:**
```bash
# Verificar status do Docker
docker ps -a
docker volume ls
docker images

# Verificar status do Nginx
systemctl status nginx
nginx -t

# Verificar arquivos
ls -la /etc/nginx/sites-available/
ls -la /home/quiosque/
```

### **Logs do sistema:**
```bash
# Logs do Docker
journalctl -u docker

# Logs do Nginx
tail -f /var/log/nginx/error.log
```

## 💡 **Dicas de Segurança:**

### **Antes de executar:**
1. **Faça backup** de dados importantes
2. **Documente** configurações atuais
3. **Teste** em ambiente de desenvolvimento
4. **Tenha plano** de recuperação

### **Durante execução:**
1. **Leia atentamente** todas as mensagens
2. **Confirme** apenas se tiver certeza
3. **Não interrompa** o processo
4. **Aguarde** conclusão completa

## 🎉 **Resultado Final:**

Após a execução bem-sucedida:
- 🧹 **VPS completamente limpa**
- 🚀 **Pronta para nova instalação**
- 🔒 **Nginx funcionando com configuração padrão**
- 🐳 **Docker limpo e funcionando**
- 📋 **Todos os dados removidos permanentemente**

## ⚠️ **LEMBRETE FINAL:**

**Esta operação é IRREVERSÍVEL!**
**Todos os dados serão perdidos para sempre!**
**Use apenas se tiver certeza absoluta!**

**O script foi projetado para ser seguro, mas a responsabilidade é sua!** 🚨
