# Reorganização da Estrutura da API

## Problema Identificado

A estrutura anterior dos endpoints estava confusa e inconsistente:

### ❌ Estrutura Antiga (Confusa)
```
/orders/{table_id}/orders/           # Criar pedido
/orders/{table_id}/orders/           # Listar pedidos  
/orders/{table_id}/orders/{order_id} # Obter pedido
/orders/{table_id}/orders/{order_id} # Atualizar pedido
/orders/{table_id}/orders/{order_id}/finish  # Finalizar pedido
/orders/{table_id}/orders/{order_id}/cancel  # Cancelar pedido
```

**Problemas:**
- Redundância: `/orders/{table_id}/orders/` - "orders" repetido
- Confuso: Pedidos ficavam sob `/orders` em vez de `/tables`
- Inconsistente: Mesas e pedidos em rotas separadas

## ✅ Nova Estrutura (Lógica e RESTful)

### Estrutura Reorganizada
```
/tables/{table_id}/orders/           # Criar pedido
/tables/{table_id}/orders/           # Listar pedidos
/tables/{table_id}/orders/{order_id} # Obter pedido
/tables/{table_id}/orders/{order_id} # Atualizar pedido
/tables/{table_id}/orders/{order_id}/finish  # Finalizar pedido
/tables/{table_id}/orders/{order_id}/cancel  # Cancelar pedido
```

### Endpoints Completos

#### Mesas (Tables)
```
GET    /tables/                    # Listar mesas
POST   /tables/                    # Criar mesa
PUT    /tables/{table_id}          # Atualizar mesa
DELETE /tables/{table_id}          # Remover mesa
PUT    /tables/{table_id}/close    # Fechar mesa
```

#### Pedidos (Orders) - Agora sob Tables
```
POST   /tables/{table_id}/orders                    # Criar pedido
GET    /tables/{table_id}/orders                    # Listar pedidos da mesa
GET    /tables/{table_id}/orders/{order_id}         # Obter pedido específico
PUT    /tables/{table_id}/orders/{order_id}         # Atualizar pedido
DELETE /tables/{table_id}/orders/{order_id}         # Remover pedido
PUT    /tables/{table_id}/orders/{order_id}/finish  # Finalizar pedido
PUT    /tables/{table_id}/orders/{order_id}/cancel  # Cancelar pedido
```

## Benefícios da Nova Estrutura

### 1. **Hierarquia Lógica**
- Pedidos pertencem a mesas → `/tables/{table_id}/orders/`
- Relacionamento claro entre recursos

### 2. **RESTful**
- Segue convenções REST
- URLs mais intuitivas
- Estrutura hierárquica clara

### 3. **Consistência**
- Todos os recursos relacionados a mesas ficam sob `/tables`
- Padrão uniforme em toda a API

### 4. **Facilidade de Uso**
- URLs mais curtas e claras
- Menos redundância
- Mais fácil de entender e usar

## Migração

### Antes
```bash
# Criar pedido
POST /orders/1/orders/

# Listar pedidos da mesa
GET /orders/1/orders/

# Obter pedido específico
GET /orders/1/orders/5/
```

### Agora
```bash
# Criar pedido
POST /tables/1/orders/

# Listar pedidos da mesa
GET /tables/1/orders/

# Obter pedido específico
GET /tables/1/orders/5/
```

## Compatibilidade

⚠️ **Breaking Change**: Esta mudança quebra a compatibilidade com clientes existentes.

### Ações Necessárias:
1. Atualizar todos os clientes para usar a nova estrutura
2. Atualizar documentação da API
3. Atualizar testes automatizados
4. Notificar usuários sobre a mudança

### Sugestão de Transição:
- Manter endpoints antigos por um período (deprecated)
- Adicionar warnings sobre obsolescência
- Remover endpoints antigos em versão futura

## Exemplos de Uso

### Criar Pedido
```bash
curl -X POST "http://localhost:8000/tables/1/orders/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Pedido de teste",
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 25.50
      }
    ]
  }'
```

### Listar Pedidos da Mesa
```bash
curl -X GET "http://localhost:8000/tables/1/orders/" \
  -H "Authorization: Bearer {token}"
```

### Finalizar Pedido
```bash
curl -X PUT "http://localhost:8000/tables/1/orders/5/finish" \
  -H "Authorization: Bearer {token}"
```

## Conclusão

A nova estrutura é mais lógica, RESTful e fácil de usar. A hierarquia `/tables/{table_id}/orders/` reflete melhor o relacionamento entre os recursos e segue as melhores práticas de design de APIs. 