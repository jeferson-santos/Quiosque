# API de Categorias de Produtos

Este documento descreve a funcionalidade de categorias de produtos implementada na API.

## Visão Geral

A funcionalidade de categorias permite organizar produtos em grupos lógicos, onde cada produto **obrigatoriamente** deve pertencer a uma categoria. Isso facilita a organização, busca e gerenciamento dos produtos no sistema.

## Estrutura do Banco de Dados

### Tabela `categories`
- `id`: Chave primária (Integer)
- `name`: Nome da categoria (String, único)
- `description`: Descrição da categoria (String, opcional)
- `is_active`: Status ativo/inativo (Boolean, padrão: true)
- `display_order`: Ordem de exibição (Integer, padrão: 0)

### Tabela `products` (atualizada)
- `category_id`: Chave estrangeira para `categories.id` (Integer, obrigatório)

## Endpoints da API

### Categorias

#### `POST /categories/`
Cria uma nova categoria.

**Requisição:**
```json
{
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e água",
  "is_active": true,
  "display_order": 1
}
```

**Resposta:**
```json
{
  "id": 1,
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e água",
  "is_active": true,
  "display_order": 1
}
```

#### `GET /categories/`
Lista todas as categorias **ordenadas por display_order**.

**Parâmetros de query:**
- `is_active` (opcional): Filtrar por status ativo (true/false)

**Ordenação:**
- As categorias são retornadas ordenadas por `display_order` (crescente)
- Categorias com mesmo `display_order` são ordenadas por nome

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Bebidas",
    "description": "Refrigerantes, sucos e água",
    "is_active": true,
    "display_order": 1
  },
  {
    "id": 2,
    "name": "Lanches",
    "description": "Sanduíches e salgados",
    "is_active": true,
    "display_order": 2
  }
]
```

#### `GET /categories/{category_id}`
Busca uma categoria específica.

**Resposta:**
```json
{
  "id": 1,
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e água",
  "is_active": true,
  "display_order": 1
}
```

#### `GET /categories/{category_id}/with-products`
Busca uma categoria com seus produtos relacionados.

**Resposta:**
```json
{
  "id": 1,
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e água",
  "is_active": true,
  "display_order": 1,
  "products": [
    {
      "id": 1,
      "name": "Coca-Cola",
      "description": "Refrigerante Coca-Cola 350ml",
      "price": 5.50,
      "category_id": 1,
      "is_active": true,
      "stock_quantity": 50
    }
  ]
}
```

#### `PATCH /categories/{category_id}`
Atualiza uma categoria existente.

**Requisição:**
```json
{
  "name": "Bebidas e Sucos",
  "description": "Refrigerantes, sucos, água e outras bebidas",
  "display_order": 1
}
```

#### `DELETE /categories/{category_id}`
Remove uma categoria (apenas se não tiver produtos associados).

### Produtos (endpoints atualizados)

#### `POST /products/{product_id}/upload_image`
Upload de imagem para um produto específico.

**Parâmetros:**
- `file`: Arquivo de imagem (multipart/form-data)

**Resposta:**
```json
{
  "message": "Imagem do produto enviada com sucesso",
  "product_id": 1,
  "filename": "imagem.jpg",
  "content_type": "image/jpeg",
  "size": 1024
}
```

#### `GET /products/{product_id}/image`
Retorna a imagem de um produto específico.

**Resposta:** Arquivo de imagem (binary)

#### `DELETE /products/{product_id}/image`
Remove a imagem de um produto específico.

**Resposta:** 204 No Content

#### `GET /products/`
Lista produtos com informações de suas categorias.

**Parâmetros de query:**
- `is_active` (opcional): Filtrar por status ativo
- `category_id` (opcional): Filtrar por categoria

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Coca-Cola",
    "description": "Refrigerante Coca-Cola 350ml",
    "price": 5.50,
    "category_id": 1,
    "is_active": true,
    "stock_quantity": 50,
    "category": {
      "id": 1,
      "name": "Bebidas",
      "description": "Refrigerantes, sucos e água",
      "is_active": true
    }
  }
]
```

#### `GET /products/{product_id}`
Busca um produto específico com informações da sua categoria.

**Resposta:**
```json
{
  "id": 1,
  "name": "Coca-Cola",
  "description": "Refrigerante Coca-Cola 350ml",
  "price": 5.50,
  "category_id": 1,
  "is_active": true,
  "stock_quantity": 50,
  "category": {
    "id": 1,
    "name": "Bebidas",
    "description": "Refrigerantes, sucos e água",
    "is_active": true
  }
}
```

## Validações

### Criação de Produtos
- **Obrigatório**: Todo produto deve ter uma `category_id` válida
- **Validação**: A categoria deve existir e estar ativa
- **Erro**: Se a categoria não existir ou estiver inativa, retorna erro 400

### Atualização de Produtos
- **Validação**: Se `category_id` for alterado, a nova categoria deve existir e estar ativa
- **Erro**: Se a categoria não existir ou estiver inativa, retorna erro 400

### Exclusão de Categorias
- **Validação**: Categoria só pode ser excluída se não tiver produtos associados
- **Erro**: Se houver produtos associados, retorna erro 400

### Nomes de Categorias
- **Unicidade**: Nomes de categorias devem ser únicos
- **Erro**: Se tentar criar categoria com nome duplicado, retorna erro 400

## Migração de Dados

Para migrar dados existentes, execute o script:

```bash
python scripts/migrate_categories.py
```

Este script:
1. Cria a tabela `categories`
2. Adiciona a coluna `category_id` à tabela `products`
3. Cria categorias padrão
4. Associa produtos existentes à categoria "Outros"

## Categorias Padrão

O sistema cria automaticamente as seguintes categorias padrão:
- **Bebidas**: Refrigerantes, sucos, água e outras bebidas
- **Comidas**: Pratos principais, lanches e refeições
- **Sobremesas**: Doces, sorvetes e sobremesas
- **Aperitivos**: Petiscos e entradas
- **Outros**: Outros produtos diversos

## Testes

Para testar a funcionalidade, execute:

```bash
python scripts/test_categories.py
```

Este script testa:
- Criação de categorias
- Criação de produtos com categorias
- Busca de produtos por categoria
- Validações de categoria

## Permissões

- **Criação/Atualização/Exclusão**: Apenas usuários com role "administrator"
- **Leitura**: Todos os usuários autenticados

## Exemplos de Uso

### 1. Criar uma categoria
```bash
curl -X POST "http://localhost:8000/categories/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bebidas",
    "description": "Refrigerantes, sucos e água"
  }'
```

### 2. Criar um produto com categoria
```bash
curl -X POST "http://localhost:8000/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca-Cola",
    "description": "Refrigerante Coca-Cola 350ml",
    "price": 5.50,
    "category_id": 1,
    "stock_quantity": 50
  }'
```

### 3. Buscar produtos por categoria
```bash
curl -X GET "http://localhost:8000/products/?category_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Buscar produto específico com categoria
```bash
curl -X GET "http://localhost:8000/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Buscar categoria com produtos
```bash
curl -X GET "http://localhost:8000/categories/1/with-products" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Upload de imagem de produto
```bash
curl -X POST "http://localhost:8000/products/1/upload_image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@imagem.jpg"
```

### 7. Buscar imagem de produto
```bash
curl -X GET "http://localhost:8000/products/1/image" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Remover imagem de produto
```bash
curl -X DELETE "http://localhost:8000/products/1/image" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Alterar ordem de exibição de categoria
```bash
curl -X PATCH "http://localhost:8000/categories/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_order": 3
  }'
``` 