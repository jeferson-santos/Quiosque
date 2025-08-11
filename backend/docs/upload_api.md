# API de Upload de Imagens de Produtos

Esta documentação descreve os endpoints de upload de imagens para produtos do sistema de pedidos de quiosque.

## Visão Geral

O sistema oferece upload de imagens diretamente no banco de dados associadas a produtos específicos.

## Endpoints Disponíveis

### Upload de Imagens para Produtos

#### POST `/products/{product_id}/upload_image`
Upload de imagem para um produto específico (salva no banco de dados).

**Parâmetros:**
- `product_id` (path): ID do produto
- `file` (multipart/form-data): Arquivo de imagem

**Resposta:**
```json
{
  "message": "Imagem do produto enviada com sucesso",
  "product_id": 1,
  "filename": "original-name.jpg",
  "content_type": "image/jpeg",
  "size": 12345
}
```

#### GET `/products/{product_id}/image`
Obtém a imagem de um produto específico.

**Resposta:** Arquivo de imagem

#### GET `/products/images/{product_id}`
Obtém a imagem de um produto específico (endpoint alternativo).

**Resposta:** Arquivo de imagem

#### DELETE `/products/{product_id}/image`
Remove a imagem de um produto específico.

**Resposta:** 204 No Content

## Validações

### Tipos de Arquivo Permitidos
- JPG/JPEG
- PNG
- GIF
- BMP
- WEBP

### Limitações
- Tamanho máximo: 10MB por arquivo
- Autenticação obrigatória em todos os endpoints

## Exemplos de Uso

### Upload de Imagem para Produto (JavaScript)

```javascript
// Upload de imagem para produto
async function uploadProductImage(productId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/products/${productId}/upload_image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}

// Exibir imagem do produto
function displayProductImage(productId) {
  const img = document.createElement('img');
  img.src = `/products/${productId}/image`;
  img.style.maxWidth = '300px';
  document.body.appendChild(img);
}

// Exibir imagem do produto (endpoint alternativo)
function displayProductImageAlt(productId) {
  const img = document.createElement('img');
  img.src = `/products/images/${productId}`;
  img.style.maxWidth = '300px';
  document.body.appendChild(img);
}
```

### Upload de Imagem para Produto (Python)

```python
import requests

def upload_product_image(token, product_id, image_path):
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(image_path, "rb") as file:
        files = {"file": (os.path.basename(image_path), file, "image/jpeg")}
        
        response = requests.post(
            f"http://localhost:8000/products/{product_id}/upload_image",
            headers=headers,
            files=files
        )
        
        return response.json()

# Uso
result = upload_product_image(token, 1, "produto.jpg")
print(f"Imagem enviada: {result['filename']}")
```

### Upload de Imagem para Produto (cURL)

```bash
# Upload de imagem para produto
curl -X POST "http://localhost:8000/products/1/upload_image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@produto.jpg"

# Obter imagem do produto
curl -X GET "http://localhost:8000/products/1/image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output produto_imagem.jpg

# Obter imagem do produto (endpoint alternativo)
curl -X GET "http://localhost:8000/products/images/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output produto_imagem_alt.jpg
```

## Migração do Banco de Dados

Para usar os endpoints de upload de produto, é necessário executar a migração do banco de dados:

```bash
python scripts/migrate_product_images.py
```

Esta migração:
1. Adiciona as colunas `image_data`, `image_filename` e `image_content_type` à tabela `products`
2. Remove a coluna `image_url` (obsoleta)

## Testes

### Teste de Upload para Produto
```bash
python scripts/test_product_image_upload.py
```

## Estrutura do Banco de Dados

### Tabela `products` (após migração)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | Chave primária |
| name | VARCHAR | Nome do produto |
| description | VARCHAR | Descrição do produto |
| price | FLOAT | Preço do produto |
| is_active | BOOLEAN | Status ativo |
| category | VARCHAR | Categoria do produto |
| image_data | BYTEA | Dados binários da imagem |
| image_filename | VARCHAR | Nome original do arquivo |
| image_content_type | VARCHAR | Tipo MIME da imagem |
| stock_quantity | INTEGER | Quantidade em estoque |
| available_from | TIME | Horário de disponibilidade inicial |
| available_until | TIME | Horário de disponibilidade final |

## Segurança

- Todos os endpoints requerem autenticação
- Validação de tipos de arquivo
- Limitação de tamanho de arquivo
- Sanitização de nomes de arquivo
- Rollback automático em caso de erro

## Performance

- Imagens de produtos são armazenadas no banco de dados para melhor performance
- Suporte a cache de imagens (implementação futura)
- Compressão automática de imagens (implementação futura) 