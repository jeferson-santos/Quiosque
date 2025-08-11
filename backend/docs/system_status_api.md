# API de Status do Sistema

Este documento descreve a funcionalidade de controle de status do sistema para bloquear novos pedidos.

## Visão Geral

O sistema de status permite controlar se novos pedidos podem ser criados. Isso é útil em situações como:
- Cozinha lotada
- Fim de expediente
- Manutenção do sistema
- Pausas operacionais

## Estrutura do Banco de Dados

### Tabela `system_status`
- `id`: Chave primária (Integer)
- `orders_enabled`: Se novos pedidos estão habilitados (Boolean, padrão: true)
- `reason`: Motivo do bloqueio (String, opcional)
- `updated_by`: Usuário que fez a última alteração (String, opcional)
- `updated_at`: Data/hora da última alteração (DateTime)

## Endpoints da API

### Status do Sistema

#### `GET /system/status`
Retorna o status atual do sistema.

**Resposta:**
```json
{
  "id": 1,
  "orders_enabled": true,
  "reason": null,
  "updated_by": "admin",
  "updated_at": "2024-01-15T14:30:00"
}
```

#### `PATCH /system/status`
Atualiza o status do sistema (apenas administradores).

**Requisição:**
```json
{
  "orders_enabled": false,
  "reason": "Cozinha lotada - fim de expediente"
}
```

**Resposta:**
```json
{
  "id": 1,
  "orders_enabled": false,
  "reason": "Cozinha lotada - fim de expediente",
  "updated_by": "admin",
  "updated_at": "2024-01-15T14:30:00"
}
```

## Comportamento dos Pedidos

### Quando `orders_enabled = true`
- Novos pedidos podem ser criados normalmente
- Todos os endpoints de pedidos funcionam normalmente

### Quando `orders_enabled = false`
- Tentativas de criar novos pedidos retornam erro 423 (Locked)
- Mensagem de erro inclui o motivo do bloqueio
- Pedidos existentes continuam funcionando (listar, atualizar, finalizar)

## Validações

### Criação de Pedidos
- **Verificação**: Sistema verifica `orders_enabled` antes de criar pedidos
- **Erro**: Se bloqueado, retorna 423 Locked com motivo
- **Permissão**: Apenas administradores podem alterar o status

## Exemplos de Uso

### 1. Verificar status atual
```bash
curl -X GET "http://localhost:8000/system/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Bloquear novos pedidos
```bash
curl -X PATCH "http://localhost:8000/system/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orders_enabled": false,
    "reason": "Cozinha lotada - fim de expediente"
  }'
```

### 3. Habilitar novos pedidos
```bash
curl -X PATCH "http://localhost:8000/system/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orders_enabled": true,
    "reason": "Sistema reaberto"
  }'
```

### 4. Tentar criar pedido quando bloqueado
```bash
curl -X POST "http://localhost:8000/tables/1/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 10.50
      }
    ]
  }'
```

**Resposta de erro:**
```json
{
  "detail": "Novos pedidos estão bloqueados. Motivo: Cozinha lotada - fim de expediente"
}
```

## Códigos de Status HTTP

- **200 OK**: Status consultado/atualizado com sucesso
- **423 Locked**: Sistema bloqueado para novos pedidos
- **403 Forbidden**: Usuário sem permissão para alterar status
- **401 Unauthorized**: Token inválido ou ausente

## Permissões

- **Consulta**: Todos os usuários autenticados
- **Alteração**: Apenas usuários com role "administrator"

## Testes

Para testar a funcionalidade, execute:

```bash
python scripts/test_system_status.py
```

Este script testa:
- Verificação do status inicial
- Bloqueio do sistema
- Desbloqueio do sistema
- Verificação de status

## Integração com Frontend

### Verificação de Status
O frontend deve verificar o status antes de permitir criação de pedidos:

```javascript
// Verificar se sistema está habilitado
const response = await fetch('/system/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const status = await response.json();

if (!status.orders_enabled) {
  // Mostrar mensagem de bloqueio
  showMessage(`Sistema bloqueado: ${status.reason}`);
  disableOrderCreation();
}
```

### Interface de Administração
Criar interface para administradores controlarem o status:

```javascript
// Bloquear sistema
await fetch('/system/status', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orders_enabled: false,
    reason: 'Cozinha lotada'
  })
});
```

## Cenários de Uso

### 1. Fim de Expediente
- Administrador bloqueia sistema
- Garçons não conseguem fazer novos pedidos
- Pedidos existentes continuam sendo processados

### 2. Cozinha Lotada
- Administrador bloqueia temporariamente
- Motivo: "Cozinha lotada - aguarde 30 min"
- Sistema reaberto quando cozinha normalizar

### 3. Manutenção
- Sistema bloqueado para manutenção
- Motivo: "Manutenção em andamento"
- Reaberto após manutenção concluída

## Monitoramento

### Logs
- Todas as alterações de status são logadas
- Inclui usuário que fez a alteração
- Timestamp da alteração

### Auditoria
- Histórico de alterações mantido
- Rastreabilidade de quem bloqueou/desbloqueou
- Motivos documentados para cada alteração 