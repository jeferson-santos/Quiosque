# 📚 Documentação da API - Sistema de Quiosque

## 🔗 Endpoints Principais

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout

### Usuários
- `GET /users/me` - Perfil do usuário atual
- `GET /users/` - Listar usuários (admin)
- `POST /users/` - Criar usuário (admin)
- `PUT /users/{id}` - Atualizar usuário (admin)
- `DELETE /users/{id}` - Deletar usuário (admin)

### Categorias
- `GET /categories/` - Listar categorias
- `POST /categories/` - Criar categoria (admin)
- `PUT /categories/{id}` - Atualizar categoria (admin)
- `DELETE /categories/{id}` - Deletar categoria (admin)

### Produtos
- `GET /products/` - Listar produtos
- `POST /products/` - Criar produto (admin)
- `PUT /products/{id}` - Atualizar produto (admin)
- `DELETE /products/{id}` - Deletar produto (admin)

### Mesas
- `GET /tables/` - Listar mesas
- `POST /tables/` - Criar mesa (admin)
- `PUT /tables/{id}` - Atualizar mesa (admin)
- `DELETE /tables/{id}` - Deletar mesa (admin)

### Salas
- `GET /rooms/` - Listar salas
- `POST /rooms/` - Criar sala (admin)
- `PUT /rooms/{id}` - Atualizar sala (admin)
- `DELETE /rooms/{id}` - Deletar sala (admin)

### Pedidos
- `GET /orders/` - Listar pedidos
- `POST /orders/` - Criar pedido
- `PUT /orders/{id}` - Atualizar pedido
- `DELETE /orders/{id}` - Cancelar pedido

### Pagamentos
- `GET /payments/` - Listar pagamentos
- `POST /payments/` - Criar pagamento
- `PUT /payments/{id}` - Atualizar pagamento

### Relatórios
- `GET /reports/sales` - Relatório de vendas
- `GET /reports/consumption` - Relatório de consumo por sala

### Status do Sistema
- `GET /system-status/` - Status atual do sistema
- `PUT /system-status/` - Atualizar status (admin)

### Filas de Impressão
- `GET /print-queues/` - Listar filas de impressão
- `POST /print-queues/` - Criar fila de impressão (admin)
- `PUT /print-queues/{id}` - Atualizar fila de impressão (admin)

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

**Headers necessários:**
```
Authorization: Bearer <seu-token-jwt>
Content-Type: application/json
```

## 📊 Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `422` - Erro de validação de dados
- `500` - Erro interno do servidor

## 🚀 Como Testar

1. **Inicie o backend:**
   ```bash
   cd backend
   poetry run dev
   ```

2. **Acesse a documentação interativa:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Teste os endpoints usando:**
   - Swagger UI (interface web)
   - Postman
   - curl
   - httpx (Python)

## 📝 Exemplos de Uso

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Criar Produto
```bash
curl -X POST "http://localhost:8000/products/" \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hambúrguer", "price": 25.90, "category_id": 1}'
```

## 🔧 Configuração de Desenvolvimento

1. Copie `env.example` para `.env`
2. Configure as variáveis de ambiente
3. Inicie o banco de dados: `docker-compose up -d`
4. Execute as migrações: `cd backend && poetry run alembic upgrade head`
5. Inicie o servidor: `poetry run dev`
