# 📚 Documentação do Sistema de Quiosque

Esta pasta contém toda a documentação necessária para entender, configurar e manter o sistema de quiosque.

## 📁 Arquivos Disponíveis

### 🚀 [DEPLOY_VPS_UBUNTU.md](./DEPLOY_VPS_UBUNTU.md)
**Guia completo para deploy em VPS Ubuntu**
- Preparação da VPS
- Instalação do Docker
- Configuração de segurança
- Deploy da aplicação
- Configuração de domínio e SSL
- Monitoramento e backup
- Troubleshooting

## 🎯 Para Quem é Esta Documentação

### 👨‍💻 **Desenvolvedores**
- Entender a arquitetura do sistema
- Configurar ambiente de desenvolvimento
- Fazer deploy em produção

### 🚀 **DevOps/Administradores**
- Configurar VPS Ubuntu
- Gerenciar containers Docker
- Configurar monitoramento e backup
- Manter sistema em produção

### 🏪 **Clientes/Restaurantes**
- Entender como o sistema funciona
- Saber o que esperar do deploy
- Compreender requisitos técnicos

## 🔧 Tecnologias Utilizadas

- **Backend**: FastAPI (Python)
- **Frontend**: React + TypeScript
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Containerização**: Docker + Docker Compose
- **Servidor Web**: Nginx (opcional)
- **SSL**: Let's Encrypt (Certbot)

## 📋 Pré-requisitos para Deploy

- **VPS Ubuntu 20.04+**
- **Mínimo**: 2GB RAM, 20GB SSD
- **Recomendado**: 4GB RAM, 40GB SSD
- **Domínio** (opcional, mas recomendado)
- **Conhecimento básico** de Linux e Docker

## 🚀 Quick Start

1. **Clone o repositório**
   ```bash
   git clone https://github.com/jeferson-santos/Quiosque.git
   cd Quiosque
   ```

2. **Configure o ambiente**
   ```bash
   cp env.prod.example .env
   # Edite .env com suas configurações
   ```

3. **Crie um cliente**
   ```bash
   ./scripts/create-client.sh \
     --client-name "Meu Restaurante" \
     --client-id "meurestaurante" \
     --domain "meurestaurante.com" \
     --skip-confirmation
   ```

4. **Faça o deploy**
   ```bash
   ./deploy-meurestaurante.sh
   ```

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/jeferson-santos/Quiosque/issues)
- **Documentação**: Esta pasta
- **Código**: [Repositório Principal](https://github.com/jeferson-santos/Quiosque)

## 🔄 Atualizações

Esta documentação é atualizada regularmente. Para a versão mais recente:

```bash
git pull origin main
```

## 📝 Contribuições

Contribuições para melhorar a documentação são bem-vindas! 

1. Faça um fork do repositório
2. Crie uma branch para sua contribuição
3. Faça as alterações
4. Abra um Pull Request

---

**📖 Continue lendo o [DEPLOY_VPS_UBUNTU.md](./DEPLOY_VPS_UBUNTU.md) para o guia completo de deploy!**
