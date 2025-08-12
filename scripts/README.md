# Scripts de Criação de Clientes

Esta pasta contém scripts para automatizar a criação de novos ambientes de clientes.

## Scripts Disponíveis

### Windows (PowerShell)
- `create-client.ps1` - Script principal para Windows

### Linux/Mac (Bash)
- `create-client.sh` - Script principal para Linux/Mac

## Como Usar

### Windows
```powershell
.\scripts\create-client.ps1 -ClientName "Nome do Cliente" -ClientId "id_cliente" -Domain "dominio.com"
```

### Linux/Mac
```bash
./scripts/create-client.sh "Nome do Cliente" "id_cliente" "dominio.com"
```

## Parâmetros Obrigatórios

- `ClientName` / `1º argumento`: Nome completo do cliente
- `ClientId` / `2º argumento`: ID único do cliente (sem espaços)
- `Domain` / `3º argumento`: Domínio do cliente

## Parâmetros Opcionais

- `RestaurantName`: Nome do restaurante
- `RestaurantAddress`: Endereço do restaurante
- `RestaurantPhone`: Telefone do restaurante
- `RestaurantEmail`: Email do restaurante
- `RestaurantCNPJ`: CNPJ do restaurante
- `SkipConfirmation`: Pular confirmação (Windows)

## Exemplo de Uso

```powershell
.\scripts\create-client.ps1 -ClientName "Restaurante Exemplo" -ClientId "exemplo" -Domain "exemplo.com" -SkipConfirmation
```

## Arquivos Gerados

- `env.prod.<client_id>` - Configuração de ambiente
- `docker-compose.<client_id>.yml` - Configuração Docker Compose
- `deploy-<client_id>.ps1` - Script de deploy (Windows)
- `deploy-<client_id>.sh` - Script de deploy (Linux/Mac)

## Deploy

Após criar o cliente, execute o script de deploy correspondente:

**Windows:**
```powershell
.\deploy-<client_id>.ps1
```

**Linux/Mac:**
```bash
./deploy-<client_id>.sh
```
