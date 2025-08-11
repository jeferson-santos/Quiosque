# API de Filas de Impressão

Este documento descreve a API para gerenciamento de filas de impressão do sistema.

## Visão Geral

O sistema de filas de impressão permite configurar diferentes filas para impressão de pedidos, vinculando categorias de produtos a filas específicas. Sempre existe uma fila padrão que é usada quando uma categoria não tem fila específica associada.

## Regras do Sistema

1. **Fila Padrão**: Sempre deve haver exatamente uma fila marcada como padrão (`is_default = true`)
2. **Proteção da Fila Padrão**: Não é possível excluir a única fila padrão sem definir outra
3. **Categorias sem Fila**: Categorias sem fila associada usam automaticamente a fila padrão
4. **Fechamento de Conta**: O fechamento de conta sempre utiliza a fila padrão

## Perfis de Usuário

### Agent
- ✅ **GET** `/print-queues` - Listar todas as filas
- ✅ **GET** `/print-queues/{id}` - Detalhes de uma fila
- ❌ **POST** `/print-queues` - Criar fila (não permitido)
- ❌ **PUT** `/print-queues/{id}` - Editar fila (não permitido)
- ❌ **DELETE** `/print-queues/{id}` - Remover fila (não permitido)

### Administrator
- ✅ **GET** `/print-queues` - Listar todas as filas
- ✅ **GET** `/print-queues/{id}` - Detalhes de uma fila
- ✅ **POST** `/print-queues` - Criar fila
- ✅ **PUT** `/print-queues/{id}` - Editar fila
- ✅ **DELETE** `/print-queues/{id}` - Remover fila

## Endpoints

### GET /print-queues

Lista todas as filas de impressão.

**Permissões**: `agent`, `administrator`

**Resposta**:
```json
[
  {
    "id": 1,
    "name": "Fila Padrão",
    "description": "Fila de impressão padrão do sistema",
    "printer_name": null,
    "is_default": true
  },
  {
    "id": 2,
    "name": "Fila Bar",
    "description": "Fila para impressão de pedidos do bar",
    "printer_name": "Bar-Printer-01",
    "is_default": false
  }
]
```

### GET /print-queues/{id}

Retorna detalhes de uma fila específica.

**Permissões**: `agent`, `administrator`

**Parâmetros**:
- `id` (integer): ID da fila

**Resposta**:
```json
{
  "id": 1,
  "name": "Fila Padrão",
  "description": "Fila de impressão padrão do sistema",
  "printer_name": null,
  "is_default": true
}
```

### POST /print-queues

Cria uma nova fila de impressão.

**Permissões**: `administrator`

**Corpo da Requisição**:
```json
{
  "name": "Fila Cozinha",
  "description": "Fila para impressão de pedidos da cozinha",
  "printer_name": "Kitchen-Printer-01",
  "is_default": false
}
```

**Campos**:
- `name` (string, obrigatório): Nome da fila
- `description` (string, opcional): Descrição da fila
- `printer_name` (string, opcional): Nome da impressora
- `is_default` (boolean, opcional): Se é a fila padrão (padrão: false)

**Resposta** (201 Created):
```json
{
  "id": 3,
  "name": "Fila Cozinha",
  "description": "Fila para impressão de pedidos da cozinha",
  "printer_name": "Kitchen-Printer-01",
  "is_default": false
}
```

### PUT /print-queues/{id}

Atualiza uma fila de impressão existente.

**Permissões**: `administrator`

**Parâmetros**:
- `id` (integer): ID da fila

**Corpo da Requisição**:
```json
{
  "name": "Fila Cozinha Atualizada",
  "description": "Fila para impressão de pedidos da cozinha e bar",
  "is_default": true
}
```

**Campos** (todos opcionais):
- `name` (string): Nome da fila
- `description` (string): Descrição da fila
- `printer_name` (string): Nome da impressora
- `is_default` (boolean): Se é a fila padrão

**Resposta**:
```json
{
  "id": 3,
  "name": "Fila Cozinha Atualizada",
  "description": "Fila para impressão de pedidos da cozinha e bar",
  "printer_name": "Kitchen-Printer-01",
  "is_default": true
}
```

### DELETE /print-queues/{id}

Remove uma fila de impressão.

**Permissões**: `administrator`

**Parâmetros**:
- `id` (integer): ID da fila

**Resposta** (204 No Content)

**Observações**:
- Não é possível excluir a única fila padrão
- Se a fila excluída for padrão, outra fila será automaticamente definida como padrão

## Associação com Categorias

### Campo print_queue_id

Cada categoria pode ter um campo `print_queue_id` que associa a categoria a uma fila específica:

```json
{
  "id": 1,
  "name": "Bebidas",
  "description": "Bebidas e refrigerantes",
  "is_active": true,
  "display_order": 0,
  "print_queue_id": 2,
  "print_queue_config": {
    "id": 2,
    "name": "Fila Bar",
    "description": "Fila para impressão de pedidos do bar",
    "printer_name": "Bar-Printer-01",
    "is_default": false
  }
}
```

### Comportamento

1. **Categoria com fila específica**: Usa a fila associada
2. **Categoria sem fila específica** (`print_queue_id = null`): Usa a fila padrão
3. **Fechamento de conta**: Sempre usa a fila padrão

## Scripts de Teste

### Inicialização
```bash
python scripts/init_print_queues.py
```

### Teste de Funcionalidades
```bash
python scripts/test_print_queues.py
```

### Teste de Associação com Categorias
```bash
python scripts/test_category_print_queues.py
```

### Teste de API
```bash
python scripts/test_print_queues_api.py
```

### Criação de Usuário Agent
```bash
python scripts/create_agent_user.py
```

## Migração

Para adicionar o campo `print_queue_id` às categorias existentes:

```bash
python scripts/migrate_print_queue_id.py
```

## Exemplos de Uso

### Criar Fila para Bar
```bash
curl -X POST "http://localhost:8000/print-queues" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fila Bar",
    "description": "Fila para impressão de pedidos do bar",
    "printer_name": "Bar-Printer-01",
    "is_default": false
  }'
```

### Associar Categoria à Fila
```bash
curl -X PATCH "http://localhost:8000/categories/1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "print_queue_id": 2
  }'
```

### Listar Filas (Agent)
```bash
curl -X GET "http://localhost:8000/print-queues" \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN"
``` 