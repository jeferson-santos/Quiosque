🏖️ Sistema de Pedidos para Quiosque

> Projeto desenvolvido por **Jeferson dos Santos**

Um sistema web leve, rápido e prático para digitalizar o processo de vendas em quiosques. Desenvolvido com **FastAPI** e **Poetry**, tem como objetivo modernizar o atendimento, reduzir fraudes e facilitar o fechamento do caixa diário.

---

## ⚙️ Funcionalidades

- Interface para garçons lançarem pedidos via celular
- Impressão automática na copa/cozinha com nome da mesa e horário
- Fechamento de contas com cálculo automático de taxa de serviço (10%)
- Relatórios diários de vendas e comissão de garçons
- Controle total e rastreável por mesa

---

## 🚀 Tecnologias Utilizadas

- Python 3.12+
- [FastAPI](https://fastapi.tiangolo.com/)
- [Uvicorn](https://www.uvicorn.org/)
- [Poetry](https://python-poetry.org/)

---

## 🧑‍💻 Como rodar o projeto

Você pode rodar com **Poetry**.

---

### 🔹 Rodando com Poetry

> Recomendado para desenvolvimento local

1. Instale o Poetry:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -

2. Clone o projeto:
   ```bash
   git clone https://github.com/seu-usuario/pedidos_quiosque.git
   cd pedidos_quiosque 

3. Instale as dependências:
    ```bash
    poetry install

4. Rode o servidor:
    ```bash
    poetry run uvicorn app.main:app --reload

Acesse em: http://localhost:8000

Documentação automática:

Swagger: /docs

Redoc: /redoc

---

## 🏨 Relatórios de Consumo por Quarto

O sistema agora suporta relatórios detalhados de consumo por quarto, permitindo que hotéis controlem o consumo de restaurante/room service de cada hóspede.

### 📊 Funcionalidades do Relatório

- **Consumo por data específica**: Relatórios diários de consumo
- **Apenas "Conta do Quarto"**: Inclui apenas pedidos pagos com método "ROOM_CHARGE"
- **Mesas fechadas**: Apenas mesas que foram fechadas são consideradas
- **Detalhamento por produto**: Lista todos os produtos consumidos com quantidades e valores
- **Controle por mesa**: Mostra quais mesas foram utilizadas pelo quarto
- **Status dos pedidos**: Controle de pedidos pendentes, finalizados e cancelados
- **Impressão automática**: Relatórios podem ser enviados para a fila de impressão

### ⚠️ **Importante: Filtro de Pagamento**

O relatório de consumo do quarto **sempre inclui apenas** pedidos que foram pagos com o método de pagamento **"ROOM_CHARGE" (Conta do Quarto)**. Pedidos pagos com dinheiro, cartão ou PIX são automaticamente excluídos do relatório.

Isso garante que apenas o consumo que será cobrado na conta do hóspede seja contabilizado.

### 🔗 Endpoints Disponíveis

#### Obter Relatório de Consumo
```http
GET /rooms/{room_id}/consumption-report
```

**Parâmetros de Query:**
- `date` (opcional): Data do relatório (YYYY-MM-DD). Se não informada, usa a data atual
- `include_all_tables` (opcional): Boolean, padrão `false`. Se `true`, inclui todas as mesas fechadas no dia, mesmo sem pedidos

**Exemplos:**

**Relatório com data específica (apenas mesas com pedidos):**
```bash
curl -X GET "http://localhost:8000/rooms/1/consumption-report?date=2024-01-15" \
  -H "Authorization: Bearer {token}"
```

**Relatório com data específica (todas as mesas fechadas):**
```bash
curl -X GET "http://localhost:8000/rooms/1/consumption-report?date=2024-01-15&include_all_tables=true" \
  -H "Authorization: Bearer {token}"
```

**Relatório com data atual (padrão):**
```bash
curl -X GET "http://localhost:8000/rooms/1/consumption-report" \
  -H "Authorization: Bearer {token}"
```

#### Imprimir Relatório de Consumo
```http
POST /rooms/{room_id}/print-consumption-report
```

**Parâmetros de Query:**
- `date` (opcional): Data do relatório (YYYY-MM-DD). Se não informada, usa a data atual
- `include_all_tables` (opcional): Boolean, padrão `false`. Se `true`, inclui todas as mesas fechadas no dia, mesmo sem pedidos

**Exemplos:**

**Imprimir relatório com data específica (apenas mesas com pedidos):**
```bash
curl -X POST "http://localhost:8000/rooms/1/print-consumption-report?date=2024-01-15" \
  -H "Authorization: Bearer {token}"
```

**Imprimir relatório com data específica (todas as mesas fechadas):**
```bash
curl -X POST "http://localhost:8000/rooms/1/print-consumption-report?date=2024-01-15&include_all_tables=true" \
  -H "Authorization: Bearer {token}"
```

**Imprimir relatório com data atual (padrão):**
```bash
curl -X POST "http://localhost:8000/rooms/1/print-consumption-report" \
  -H "Authorization: Bearer {token}"
```

#### Buscar Mesas de um Quarto
```http
GET /rooms/{room_id}/tables
```

**Exemplo:**
```bash
curl -X GET "http://localhost:8000/rooms/1/tables" \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Mesa 1",
    "is_closed": false,
    "created_by": "garcom1",
    "created_at": "2024-01-15T10:30:00",
    "closed_at": null,
    "room_id": 1
  },
  {
    "id": 2,
    "name": "Mesa 2",
    "is_closed": true,
    "created_by": "garcom2",
    "created_at": "2024-01-15T12:15:00",
    "closed_at": "2024-01-15T16:30:00",
    "room_id": 1
  }
]
```

#### Desassociar Mesas de um Quarto
```http
POST /rooms/{room_id}/disassociate-tables
```

**Descrição:** Desassocia todas as mesas de um quarto, definindo `room_id` como `NULL`. 
Isso permite que o quarto seja excluído posteriormente.

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/rooms/1/disassociate-tables" \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "message": "Desassociadas 3 mesa(s) do quarto 101",
  "room_id": 1,
  "room_number": "101",
  "tables_disassociated": 3
}
```

#### Excluir Quarto
```http
DELETE /rooms/{room_id}
```

**ATENÇÃO:** Não é possível excluir um quarto que tenha mesas associadas.

**Validação:**
- Verifica se existem mesas associadas ao quarto
- Se houver mesas, retorna erro 400 com mensagem explicativa
- Se não houver mesas, permite a exclusão

**Exemplo de erro:**
```json
{
  "detail": "Não é possível excluir o quarto 101. Existem 3 mesa(s) associada(s) a este quarto. Remova ou desassocie as mesas antes de excluir o quarto."
}
```

**Exemplo de sucesso:**
```bash
curl -X DELETE "http://localhost:8000/rooms/1" \
  -H "Authorization: Bearer {token}"
# Retorna 204 No Content
```

### 📋 Estrutura do Relatório

O relatório de consumo do quarto inclui:

- **Informações do quarto**: Número e nome do hóspede
- **Data de referência**: Data do relatório
- **Métricas gerais**: Total de mesas, pedidos, itens e receita
- **Valores**: Subtotal, taxa de serviço e total a cobrar
- **Detalhamento por mesa**: Consumo de cada mesa fechada
- **Detalhamento por produto**: Produtos consumidos e quantidades
- **Status dos pedidos**: Distribuição por status
- **Informações técnicas**: IDs e identificadores únicos

### 🔄 Mudanças Recentes no Relatório

#### Nova Funcionalidade: `include_all_tables`

**Problema anterior:**
- O relatório retornava apenas mesas que tinham pedidos
- Mesas fechadas sem pedidos não apareciam no relatório

**Solução implementada:**
- Novo parâmetro `include_all_tables` (boolean, opcional)
- Filtro por data de fechamento (`closed_at`) em vez de data de criação
- Inclusão de mesas vazias quando `include_all_tables=true`

**Comportamento:**
- `include_all_tables=false` (padrão): Apenas mesas com pedidos pagos via "ROOM_CHARGE"
- `include_all_tables=true`: Todas as mesas fechadas no dia, mesmo sem pedidos

**Período de análise:**
- Filtro por data de fechamento da mesa (`closed_at`)
- Período completo: 00:00:00 até 23:59:59 do dia especificado

**Compatibilidade:**
- Mantém compatibilidade com chamadas existentes
- Comportamento padrão não alterado
- Nova funcionalidade opcional

### 🛡️ Validação de Exclusão de Quartos

#### Proteção contra Exclusão Acidental

**Problema identificado:**
- Quartos com mesas associadas poderiam ser excluídos
- Isso causaria perda de dados históricos importantes
- Mesas ficariam "órfãs" no sistema

**Solução implementada:**
- Validação obrigatória antes da exclusão
- Verificação de mesas associadas ao quarto
- Endpoint para desassociação segura de mesas

**Comportamento:**
- **Com mesas associadas**: Erro 400 com mensagem explicativa
- **Sem mesas associadas**: Exclusão permitida
- **Desassociação**: Endpoint específico para remover associações

**Fluxo recomendado:**
1. Verificar mesas do quarto: `GET /rooms/{id}/tables`
2. Desassociar mesas (se necessário): `POST /rooms/{id}/disassociate-tables`
3. Excluir quarto: `DELETE /rooms/{id}`

### 🧪 Testando a Funcionalidade

#### Executar Seeds Atualizados

Para testar todas as funcionalidades, execute os seeds na ordem correta:

```bash
# 1. Executar todos os seeds (recomendado)
python scripts/seed_all.py

# 2. Ou executar individualmente:
python scripts/seed_rooms.py              # Criar quartos
python scripts/seed_tables.py             # Criar mesas básicas
python scripts/seed_tables_with_room.py   # Criar mesas vinculadas
python scripts/seed_products.py           # Criar produtos
python scripts/seed_orders_with_payments.py  # Criar pedidos com pagamentos
python scripts/seed_close_tables_with_room_charge.py  # Fechar mesas com ROOM_CHARGE

# 3. Verificar dados criados
python scripts/verify_seed_data.py
```

#### Scripts de Seed Disponíveis

- **`seed_rooms.py`**: Cria 10 quartos com nomes de hóspedes
- **`seed_tables.py`**: Cria 5 mesas básicas (sem quarto)
- **`seed_tables_with_room.py`**: Cria 2 mesas vinculadas a quartos
- **`seed_products.py`**: Cria 40+ produtos em diferentes categorias
- **`seed_orders_with_payments.py`**: Cria pedidos com pagamentos (inclui ROOM_CHARGE)
- **`seed_close_tables_with_room_charge.py`**: Fecha mesas com ROOM_CHARGE para teste
- **`verify_seed_data.py`**: Mostra estatísticas dos dados criados

#### Dados de Teste Criados

Após executar os seeds, você terá:

- **10 quartos** com nomes de hóspedes
- **7 mesas** (5 básicas + 2 vinculadas a quartos)
- **40+ produtos** em categorias (Frutos do Mar, Petiscos, Bebidas, etc.)
- **Pedidos variados** com diferentes status
- **Pagamentos** incluindo ROOM_CHARGE
- **Mesas fechadas** com ROOM_CHARGE para testar relatórios

### 💡 Casos de Uso

- **Check-out do hóspede**: Imprimir relatório completo do consumo
- **Controle diário**: Verificar consumo por data específica  
- **Auditoria**: Rastrear todos os pedidos de um quarto
- **Faturamento**: Gerar relatórios para cobrança de room service
- **Integração**: Formatação específica para sistemas externos

### 📄 **Impressão Formatada**

O relatório de consumo é formatado especificamente para integração com sistemas externos:

#### 📋 **Estrutura da Impressão:**

- **Cabeçalho**: Informações do quarto, hóspede e data/hora
- **Método de pagamento**: Destaque para "CONTA DO QUARTO"
- **Resumo financeiro**: Subtotal, taxa de serviço e total a cobrar
- **Detalhamento por mesa**: Mesas fechadas com valores
- **Detalhamento por produto**: Produtos consumidos com quantidades e valores
- **Informações técnicas**: Dados para integração
- **Identificador único**: Código para rastreamento no sistema

#### 🎯 **Características:**

- ✅ **Formatação profissional** para sistemas externos
- ✅ **Destaque para valor total** a cobrar
- ✅ **Detalhamento completo** por mesa e produto
- ✅ **Identificador único** para rastreamento
- ✅ **Apenas pedidos ROOM_CHARGE** (conta do quarto)
- ✅ **Apenas mesas fechadas** consideradas
- ✅ **Informações para integração** com sistemas externos

#### 📄 **Exemplo de Impressão:**

```
============================================================
CONSUMO DO QUARTO
============================================================
QUARTO: 101
HÓSPEDE: João Silva
DATA: 2024-01-15
HORA: 14:30:25

DETALHAMENTO POR MESA:
----------------------------------------
MESA: Mesa 1
  Pedidos: 2
  Itens: 5
  Valor: R$ 90.00
  Fechada em: 2024-01-15T16:30:00

MESA: Mesa 2
  Pedidos: 1
  Itens: 3
  Valor: R$ 60.00
  Fechada em: 2024-01-15T17:45:00

DETALHAMENTO POR PRODUTO:
------------------------------------------------------------
QTD  ITEM                           VALOR     TOTAL     
------------------------------------------------------------
2    Camarão Frito                  49.90     99.80     
3    Batata Frita                   22.00     66.00     
2    Coca-Cola                      6.00      12.00     
1    Caipirinha                     15.00     15.00     
------------------------------------------------------------

INFORMAÇÕES TÉCNICAS:
----------------------------------------
Quarto ID: 1
Data de referência: 2024-01-15
Total de mesas fechadas: 2
Status dos pedidos: {'finished': 3}

IDENTIFICADOR ÚNICO:
ROOM_1_20240115

============================================================
VALOR TOTAL A COBRAR:
R$ 165.00
============================================================
FIM DO RELATÓRIO
============================================================
```

#### Mudanças Implementadas

**Removido:**
- ❌ "MÉTODO DE PAGAMENTO: CONTA DO QUARTO"
- ❌ "FILTRO: APENAS MESAS COM PEDIDOS"

**Adicionado:**
- ✅ **Valor total no final** do relatório
- ✅ **Formato de tabela** para produtos
- ✅ **Layout em colunas**: QTD | ITEM | VALOR | TOTAL

**Melhorado:**
- ✅ **Truncamento** de nomes longos de produtos
- ✅ **Alinhamento** das colunas
- ✅ **Destaque** do valor total a cobrar

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🚀 Como Executar

### Pré-requisitos
- Python 3.8+
- PostgreSQL
- pip

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd pedidos_quiosque_api
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```