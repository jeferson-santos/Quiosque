# Scripts de Categorias e Produtos

Este documento explica como usar os scripts atualizados para criar categorias e produtos no sistema.

## Scripts Disponíveis

### 1. `seed_categories.py`
Cria as categorias padrão do sistema.

**Categorias criadas:**
- **Bebidas**: Refrigerantes, sucos, água, cervejas e outras bebidas
- **Petiscos**: Petiscos, aperitivos e entradas
- **Frutos do Mar**: Camarão, lula, peixe e outros frutos do mar
- **Crepes**: Crepes doces e salgados
- **Sobremesas**: Sorvetes, doces e sobremesas
- **Outros**: Outros produtos diversos

**Como executar:**
```bash
python scripts/seed_categories.py
```

### 2. `seed_products.py` (Atualizado)
Cria produtos associados às categorias criadas.

**Características:**
- Busca automaticamente a categoria pelo nome
- Associa produtos às categorias corretas
- Usa categoria "Outros" como fallback
- Valida se a categoria existe antes de criar o produto

**Como executar:**
```bash
python scripts/seed_products.py
```

### 3. `seed_all.py` (Atualizado)
Executa todos os scripts na ordem correta, incluindo categorias.

**Ordem de execução:**
1. `seed_rooms.py` - Criar quartos
2. `seed_tables.py` - Criar mesas básicas
3. `seed_tables_with_room.py` - Criar mesas vinculadas a quartos
4. `seed_categories.py` - **Criar categorias de produtos**
5. `seed_products.py` - **Criar produtos com categorias**
6. `seed_orders_with_payments.py` - Criar pedidos com pagamentos
7. `seed_close_tables_with_room_charge.py` - Fechar mesas com ROOM_CHARGE

**Como executar:**
```bash
python scripts/seed_all.py
```

### 4. `test_categories_and_products.py`
Testa a funcionalidade completa de categorias e produtos.

**Testes realizados:**
- Listagem de todas as categorias
- Listagem de produtos por categoria
- Verificação de relacionamentos
- Estatísticas gerais
- Validação de produtos sem categoria

**Como executar:**
```bash
python scripts/test_categories_and_products.py
```

## Estrutura dos Dados

### Produtos por Categoria

**Bebidas:**
- Coca-Cola, Guaraná Antarctica, Fanta Laranja, Sprite
- Água Mineral, Água de Coco, Suco de Laranja
- Cerveja Skol, Brahma, Heineken, Caipirinha

**Petiscos:**
- Batata Frita, Mandioca Frita, Calabresa Acebolada
- Frango à Passarinho, Queijo Coalho
- Pastel de Camarão, Pastel de Queijo
- Aipim com Carne Seca, Bolinho de Aipim

**Frutos do Mar:**
- Camarão Frito, Lula à Dorê, Isca de Peixe
- Bolinho de Bacalhau, Moqueca de Peixe
- Casquinha de Siri, Caranguejo

**Crepes:**
- Crepe de Frango, Crepe de Presunto e Queijo
- Crepe de Chocolate, Crepe de Banana com Canela

**Sobremesas:**
- Sorvete de Coco, Sorvete de Manga
- Açaí na Tigela, Tapioca de Coco, Tapioca de Queijo

**Outros:**
- Espetinho de Carne, Espetinho de Frango
- Salada de Frutas

## Validações Implementadas

### No Script de Produtos
- ✅ Verifica se a categoria existe antes de criar o produto
- ✅ Usa categoria "Outros" como fallback se categoria não encontrada
- ✅ Reporta erros individuais sem parar a execução
- ✅ Mostra progresso detalhado da criação

### No Script de Categorias
- ✅ Verifica se categoria já existe antes de criar
- ✅ Evita duplicação de categorias
- ✅ Lista todas as categorias criadas

## Exemplos de Saída

### Execução do seed_categories.py
```
🌱 Criando categorias padrão...
  ✅ Categoria 'Bebidas' criada com ID 1
  ✅ Categoria 'Petiscos' criada com ID 2
  ✅ Categoria 'Frutos do Mar' criada com ID 3
  ✅ Categoria 'Crepes' criada com ID 4
  ✅ Categoria 'Sobremesas' criada com ID 5
  ✅ Categoria 'Outros' criada com ID 6

🎉 6 categorias criadas com sucesso!
📋 Total de categorias no sistema: 6
```

### Execução do seed_products.py
```
🌱 Criando produtos com categorias...
  ✅ Produto 'Camarão Frito' criado na categoria 'Frutos do Mar'
  ✅ Produto 'Batata Frita' criado na categoria 'Petiscos'
  ✅ Produto 'Coca-Cola' criado na categoria 'Bebidas'
  ✅ Produto 'Crepe de Frango' criado na categoria 'Crepes'
  ✅ Produto 'Sorvete de Coco' criado na categoria 'Sobremesas'
  ✅ Produto 'Espetinho de Carne' criado na categoria 'Outros'

🎉 40 produtos criados com sucesso!
```

## Testando a API

Após executar os scripts, você pode testar os endpoints:

### Categorias
```bash
# Listar todas as categorias
curl -X GET "http://localhost:8000/categories/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar categoria específica
curl -X GET "http://localhost:8000/categories/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar categoria com produtos
curl -X GET "http://localhost:8000/categories/1/with-products" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Produtos
```bash
# Listar produtos por categoria
curl -X GET "http://localhost:8000/products/?category_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Buscar produto específico com categoria
curl -X GET "http://localhost:8000/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Erro: "Categoria não encontrada"
- Execute primeiro `seed_categories.py`
- Verifique se as categorias foram criadas corretamente

### Erro: "Produto sem categoria"
- Execute `test_categories_and_products.py` para verificar
- Todos os produtos devem ter categoria associada

### Erro: "Categoria já existe"
- Normal, o script evita duplicação
- Continue com a execução

## Próximos Passos

1. Execute `python scripts/seed_all.py` para criar todos os dados
2. Execute `python scripts/test_categories_and_products.py` para verificar
3. Teste os endpoints da API
4. Use a documentação em `docs/categories_api.md` para mais detalhes 