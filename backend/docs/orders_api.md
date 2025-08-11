# Orders API Documentation

## Endpoints

### 1. Criar Pedido
**POST** `/orders/{table_id}/orders`

Cria um novo pedido para uma mesa específica.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order` (OrderCreate): Dados do pedido

**Resposta:** `201 Created`
```json
{
  "id": 1,
  "table_id": 1,
  "comment": "Pedido especial",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00",
  "created_by": "waiter1",
  "items": [...],
  "total_amount": 25.50,
  "total_items": 3
}
```

### 2. Listar Pedidos
**GET** `/orders/{table_id}/orders`

Lista todos os pedidos de uma mesa específica.

**Parâmetros:**
- `table_id` (int): ID da mesa

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "table_id": 1,
    "comment": "Pedido especial",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00",
    "created_by": "waiter1",
    "items": [...],
    "total_amount": 25.50,
    "total_items": 3
  }
]
```

### 3. Obter Pedido Específico
**GET** `/orders/{table_id}/orders/{order_id}`

Obtém um pedido específico de uma mesa.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order_id` (int): ID do pedido

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "table_id": 1,
  "comment": "Pedido especial",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00",
  "created_by": "waiter1",
  "items": [...],
  "total_amount": 25.50,
  "total_items": 3
}
```

### 4. Atualizar Pedido
**PUT** `/orders/{table_id}/orders/{order_id}`

Atualiza um pedido existente, incluindo modificações nos itens.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order_id` (int): ID do pedido
- `order_update` (OrderUpdateWithItems): Dados para atualização

**Permissões:**
- **Administradores:** Podem atualizar pedidos em qualquer status e modificar itens
- **Garçons:** Podem atualizar apenas pedidos com status "pending" (sem modificar itens)

**Estrutura do OrderUpdateWithItems:**
```json
{
  "comment": "Comentário opcional",
  "status": "pending|finished|cancelled",
  "items_actions": [
    {
      "action": "add|update|remove",
      "item_id": 123,           // Obrigatório para update/remove
      "product_id": 456,        // Obrigatório para add
      "quantity": 2,            // Obrigatório para add/update
      "unit_price": 15.50,      // Obrigatório para add/update
      "comment": "Observação"   // Opcional
    }
  ]
}
```

**Ações disponíveis:**
- **add**: Adiciona um novo item ao pedido
- **update**: Atualiza quantidade, preço ou comentário de um item existente
- **remove**: Remove um item do pedido

**Controle de Estoque:**
- Ao adicionar itens: verifica se há estoque suficiente e decrementa
- Ao atualizar quantidade: ajusta estoque baseado na diferença
- Ao remover itens: restaura o estoque do produto

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "table_id": 1,
  "comment": "Pedido atualizado",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00",
  "created_by": "waiter1",
  "items": [...],
  "total_amount": 35.50,
  "total_items": 4
}
```

### 5. Finalizar Pedido
**PUT** `/orders/{table_id}/orders/{order_id}/finish`

Marca um pedido como finalizado.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order_id` (int): ID do pedido

**Permissões:**
- **Administradores e Garçons:** Podem finalizar pedidos

**Validações:**
- Pedido não pode estar já finalizado
- Pedido não pode estar cancelado

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "table_id": 1,
  "comment": "Pedido especial",
  "status": "finished",
  "created_at": "2024-01-15T10:30:00",
  "created_by": "waiter1",
  "items": [...],
  "total_amount": 25.50,
  "total_items": 3
}
```

### 6. Cancelar Pedido
**PUT** `/orders/{table_id}/orders/{order_id}/cancel`

Cancela um pedido.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order_id` (int): ID do pedido

**Permissões:**
- **Apenas Administradores:** Podem cancelar pedidos

**Validações:**
- Pedido não pode estar já cancelado
- Administradores podem cancelar pedidos em qualquer status (incluindo finalizados)

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "table_id": 1,
  "comment": "Pedido especial",
  "status": "cancelled",
  "created_at": "2024-01-15T10:30:00",
  "created_by": "waiter1",
  "items": [...],
  "total_amount": 25.50,
  "total_items": 3
}
```

### 7. Remover Pedido
**DELETE** `/orders/{table_id}/orders/{order_id}`

Remove um pedido do sistema.

**Parâmetros:**
- `table_id` (int): ID da mesa
- `order_id` (int): ID do pedido

**Permissões:**
- **Apenas Administradores:** Podem remover pedidos

**Resposta:** `204 No Content`

## Status dos Pedidos

- **pending**: Pedido pendente (aguardando preparo)
- **finished**: Pedido finalizado (entregue ao cliente)
- **cancelled**: Pedido cancelado

## Fluxo de Status

```
pending → finished (por garçom ou admin)
pending → cancelled (apenas por admin)
finished → cancelled (apenas por admin)
```

## Exemplos de Uso

### Adicionar Item ao Pedido
```json
{
  "items_actions": [
    {
      "action": "add",
      "product_id": 5,
      "quantity": 2,
      "unit_price": 12.50,
      "comment": "Sem cebola"
    }
  ]
}
```

### Atualizar Quantidade de Item
```json
{
  "items_actions": [
    {
      "action": "update",
      "item_id": 123,
      "quantity": 3,
      "comment": "Quantidade aumentada"
    }
  ]
}
```

### Remover Item do Pedido
```json
{
  "items_actions": [
    {
      "action": "remove",
      "item_id": 123
    }
  ]
}
```

### Múltiplas Ações Simultâneas
```json
{
  "comment": "Pedido modificado",
  "items_actions": [
    {
      "action": "update",
      "item_id": 123,
      "quantity": 2
    },
    {
      "action": "add",
      "product_id": 8,
      "quantity": 1,
      "unit_price": 18.00
    },
    {
      "action": "remove",
      "item_id": 456
    }
  ]
}
```

## Códigos de Erro

- **400 Bad Request**: Dados inválidos ou operação não permitida
- **403 Forbidden**: Permissão insuficiente
- **404 Not Found**: Mesa, pedido ou item não encontrado
- **423 Locked**: Sistema bloqueado para novos pedidos

## Autenticação

Todos os endpoints requerem autenticação via Bearer Token no header:
```
Authorization: Bearer <token>
``` 