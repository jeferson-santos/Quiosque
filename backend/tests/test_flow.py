"""
Teste completo de flow da API.

Este módulo contém testes que validam o fluxo completo da API,
incluindo criação de usuários, produtos, mesas, pedidos, pagamentos e relatórios.
"""

from datetime import datetime

import httpx

BASE_URL = "http://127.0.0.1:8000"


def get_admin_token():
    """Obtém o token de autenticação do admin"""
    response = httpx.post(
        f"{BASE_URL}/login/",
        data={"username": "admin", "password": "admin1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert (
        response.status_code == 200
    ), f"Erro ao autenticar admin: {response.status_code} - {response.text}"
    return response.json()["access_token"]


def get_waiter_token(username, password):
    """Obtém o token de autenticação de um garçom"""
    response = httpx.post(
        f"{BASE_URL}/login/",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert (
        response.status_code == 200
    ), f"Erro ao autenticar garçom: {response.status_code} - {response.text}"
    return response.json()["access_token"]


def test_complete_api_flow():
    """Teste completo da API - criação de usuários, produtos, mesas, pedidos, pagamentos e relatórios"""

    # Gerar timestamp único para evitar conflitos
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")  # Incluir microssegundos

    # ===== FASE 0: CRUD DE QUARTOS (ROOMS) =====
    print("\n=== FASE 0: Testando CRUD de quartos ===")

    admin_token = get_admin_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Criar quarto (admin)
    room_data = {
        "number": f"101_{timestamp}",
        "status": "available",
        "guest_name": "Hóspede Teste",
    }
    response = httpx.post(f"{BASE_URL}/rooms/", json=room_data, headers=admin_headers)
    assert (
        response.status_code == 201
    ), f"Erro ao criar quarto: {response.status_code} - {response.text}"
    room = response.json()
    room_id = room["id"]
    print("✓ Quarto criado com sucesso (admin)")

    # ===== FASE 1: CRIAÇÃO DE USUÁRIOS =====
    print("\n=== FASE 1: Criando usuários ===")

    admin_token = get_admin_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Criar usuário garçom
    waiter_data = {
        "username": f"waiter_flow_{timestamp}",
        "password": "Test1234",
        "role": "waiter",
    }

    response = httpx.post(f"{BASE_URL}/users/", json=waiter_data, headers=admin_headers)
    assert (
        response.status_code == 201
    ), f"Erro ao criar garçom: {response.status_code} - {response.text}"
    waiter_user = response.json()
    waiter_username = waiter_user["username"]
    assert waiter_user["role"] == "waiter"
    print("✓ Garçom criado com sucesso")

    # Criar usuário administrador
    new_admin_data = {
        "username": f"admin_flow_{timestamp}",
        "password": "Admin1234",
        "role": "administrator",
    }

    response = httpx.post(
        f"{BASE_URL}/users/", json=new_admin_data, headers=admin_headers
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar admin: {response.status_code} - {response.text}"
    new_admin_user = response.json()
    admin_username = new_admin_user["username"]
    assert new_admin_user["role"] == "administrator"
    print("✓ Administrador criado com sucesso")

    # Testar listagem de usuários
    response = httpx.get(f"{BASE_URL}/users/", headers=admin_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao listar usuários: {response.status_code} - {response.text}"
    users = response.json()
    assert len(users) >= 3  # admin original + 2 novos usuários
    print(f"✓ Listagem de usuários: {len(users)} usuários encontrados")

    # Testar obtenção de usuário específico
    response = httpx.get(f"{BASE_URL}/users/{waiter_username}", headers=admin_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao obter usuário: {response.status_code} - {response.text}"
    user_detail = response.json()
    assert user_detail["username"] == waiter_username
    print("✓ Usuário específico obtido com sucesso")

    # Testar alteração de senha
    password_update = {"password": "NewPassword1234"}
    response = httpx.put(
        f"{BASE_URL}/users/{waiter_username}/password",
        json=password_update,
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao alterar senha: {response.status_code} - {response.text}"
    print("✓ Senha alterada com sucesso")

    # Testar alteração de role
    role_update = {"role": "waiter"}  # Manter como waiter
    response = httpx.put(
        f"{BASE_URL}/users/{waiter_username}/role",
        json=role_update,
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao alterar role: {response.status_code} - {response.text}"
    print("✓ Role alterada com sucesso")

    # Obter token do garçom real após criação
    waiter_token_real = get_waiter_token(waiter_username, "NewPassword1234")
    waiter_headers_real = {"Authorization": f"Bearer {waiter_token_real}"}

    # Tentar criar quarto (garçom) - deve falhar
    response = httpx.post(
        f"{BASE_URL}/rooms/", json=room_data, headers=waiter_headers_real
    )
    assert response.status_code == 403, "Garçom não deveria conseguir criar quarto"
    print("✓ Garçom não consegue criar quarto (esperado)")

    # Listar quartos (garçom)
    response = httpx.get(f"{BASE_URL}/rooms/", headers=waiter_headers_real)
    assert response.status_code == 200, "Garçom deve conseguir listar quartos"
    print("✓ Garçom consegue listar quartos")

    # Obter quarto específico (garçom)
    response = httpx.get(f"{BASE_URL}/rooms/{room_id}", headers=waiter_headers_real)
    assert response.status_code == 200, "Garçom deve conseguir obter quarto"
    print("✓ Garçom consegue obter quarto específico")

    # Atualizar quarto (garçom) - deve falhar
    update_data = {"status": "occupied", "guest_name": "Fulano Teste"}
    response = httpx.put(
        f"{BASE_URL}/rooms/{room_id}", json=update_data, headers=waiter_headers_real
    )
    assert response.status_code == 403, "Garçom não deveria conseguir atualizar quarto"
    print("✓ Garçom não consegue atualizar quarto (esperado)")

    # Remover quarto (garçom) - deve falhar
    response = httpx.delete(f"{BASE_URL}/rooms/{room_id}", headers=waiter_headers_real)
    assert response.status_code == 403, "Garçom não deveria conseguir remover quarto"
    print("✓ Garçom não consegue remover quarto (esperado)")

    # ===== FASE 2: CRIAÇÃO DE PRODUTOS =====
    print("\n=== FASE 2: Criando produtos ===")

    # Produto 1 - Bebida
    product1_data = {
        "name": "Coca-Cola",
        "description": "Refrigerante Coca-Cola 350ml",
        "price": 5.50,
        "is_active": True,
        "category": "Bebidas",
        "stock_quantity": 100,
        "available_from": "08:00:00",
        "available_until": "23:00:00",
    }

    response = httpx.post(
        f"{BASE_URL}/products/", json=product1_data, headers=admin_headers
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar produto 1: {response.status_code} - {response.text}"
    product1 = response.json()
    assert product1["name"] == "Coca-Cola"
    assert product1["price"] == 5.50
    print("✓ Produto 1 (Coca-Cola) criado com sucesso")

    # Produto 2 - Comida
    product2_data = {
        "name": "X-Burger",
        "description": "Hambúrguer com queijo, alface e tomate",
        "price": 15.90,
        "is_active": True,
        "category": "Lanches",
        "stock_quantity": 50,
        "available_from": "10:00:00",
        "available_until": "22:00:00",
    }

    response = httpx.post(
        f"{BASE_URL}/products/", json=product2_data, headers=admin_headers
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar produto 2: {response.status_code} - {response.text}"
    product2 = response.json()
    assert product2["name"] == "X-Burger"
    assert product2["price"] == 15.90
    print("✓ Produto 2 (X-Burger) criado com sucesso")

    # Testar obtenção de produto específico
    response = httpx.get(f"{BASE_URL}/products/{product1['id']}", headers=admin_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao obter produto: {response.status_code} - {response.text}"
    product_detail = response.json()
    assert product_detail["id"] == product1["id"]
    print("✓ Produto específico obtido com sucesso")

    # Listar produtos
    response = httpx.get(f"{BASE_URL}/products/", headers=admin_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao listar produtos: {response.status_code} - {response.text}"
    products = response.json()
    assert len(products) >= 2
    print(f"✓ Listagem de produtos: {len(products)} produtos encontrados")

    # ===== FASE 3: CRIAÇÃO DE MESAS =====
    print("\n=== FASE 3: Criando mesas ===")

    # Obter token do garçom
    waiter_token = get_waiter_token(waiter_username, "NewPassword1234")
    waiter_headers = {"Authorization": f"Bearer {waiter_token}"}

    # Mesa 1 associada a quarto
    table1_data = {"name": f"Mesa_1_Flow_{timestamp}", "room_id": room_id}
    response = httpx.post(
        f"{BASE_URL}/tables/", json=table1_data, headers=waiter_headers
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar mesa 1: {response.status_code} - {response.text}"
    table1 = response.json()
    assert table1["is_closed"] is False
    assert table1["room_id"] == room_id
    print("✓ Mesa 1 criada e associada ao quarto com sucesso")

    # Mesa 2
    table2_data = {"name": f"Mesa_2_Flow_{timestamp}"}
    response = httpx.post(
        f"{BASE_URL}/tables/", json=table2_data, headers=waiter_headers
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar mesa 2: {response.status_code} - {response.text}"
    table2 = response.json()
    assert table2["is_closed"] is False
    print("✓ Mesa 2 criada com sucesso")

    # Listar mesas abertas
    response = httpx.get(f"{BASE_URL}/tables/?is_closed=false", headers=waiter_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao listar mesas: {response.status_code} - {response.text}"
    tables = response.json()
    assert len(tables) >= 2
    print(f"✓ Listagem de mesas: {len(tables)} mesas abertas encontradas")

    # ===== FASE 4: CRIAÇÃO DE PEDIDOS =====
    print("\n=== FASE 4: Criando pedidos ===")

    # Pedido 1 na Mesa 1
    order1_data = {
        "comment": "Pedido da mesa 1",
        "items": [
            {
                "product_id": product1["id"],
                "quantity": 2,
                "unit_price": product1["price"],
                "comment": "Sem gelo",
            }
        ],
    }

    response = httpx.post(
        f"{BASE_URL}/orders/{table1['id']}/orders",
        json=order1_data,
        headers=waiter_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pedido 1: {response.status_code} - {response.text}"
    order1 = response.json()
    assert len(order1["items"]) == 1
    assert order1["items"][0]["quantity"] == 2
    print("✓ Pedido 1 (Coca-Cola) criado com sucesso")

    # Pedido 2 na Mesa 1
    order2_data = {
        "comment": "Pedido da mesa 1 - segundo pedido",
        "items": [
            {
                "product_id": product2["id"],
                "quantity": 1,
                "unit_price": product2["price"],
                "comment": "Sem cebola",
            }
        ],
    }

    response = httpx.post(
        f"{BASE_URL}/orders/{table1['id']}/orders",
        json=order2_data,
        headers=waiter_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pedido 2: {response.status_code} - {response.text}"
    order2 = response.json()
    assert len(order2["items"]) == 1
    assert order2["items"][0]["quantity"] == 1
    print("✓ Pedido 2 (X-Burger) criado com sucesso")

    # Pedido 3 na Mesa 2 (com múltiplos itens)
    order3_data = {
        "comment": "Pedido da mesa 2",
        "items": [
            {
                "product_id": product1["id"],
                "quantity": 1,
                "unit_price": product1["price"],
                "comment": "Com gelo",
            },
            {
                "product_id": product2["id"],
                "quantity": 2,
                "unit_price": product2["price"],
                "comment": "Bem passado",
            },
        ],
    }

    response = httpx.post(
        f"{BASE_URL}/orders/{table2['id']}/orders",
        json=order3_data,
        headers=waiter_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pedido 3: {response.status_code} - {response.text}"
    order3 = response.json()
    assert len(order3["items"]) == 2
    assert order3["total_items"] == 3  # 1 + 2
    print("✓ Pedido 3 (múltiplos itens) criado com sucesso")

    # Testar obtenção de pedido específico
    response = httpx.get(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order1['id']}",
        headers=waiter_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao obter pedido específico: {response.status_code} - {response.text}"
    order_detail = response.json()
    assert order_detail["id"] == order1["id"]
    print("✓ Pedido específico obtido com sucesso")

    # Listar pedidos da Mesa 1
    response = httpx.get(
        f"{BASE_URL}/orders/{table1['id']}/orders", headers=waiter_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao listar pedidos da mesa 1: {response.status_code} - {response.text}"
    table1_orders = response.json()
    assert len(table1_orders) == 2
    print(f"✓ Listagem de pedidos da Mesa 1: {len(table1_orders)} pedidos encontrados")

    # Listar pedidos da Mesa 2
    response = httpx.get(
        f"{BASE_URL}/orders/{table2['id']}/orders", headers=waiter_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao listar pedidos da mesa 2: {response.status_code} - {response.text}"
    table2_orders = response.json()
    assert len(table2_orders) == 1
    print(f"✓ Listagem de pedidos da Mesa 2: {len(table2_orders)} pedidos encontrados")

    # Verificar total de itens
    total_items_mesa1 = sum(order["total_items"] for order in table1_orders)
    total_items_mesa2 = sum(order["total_items"] for order in table2_orders)
    print(f"✓ Mesa 1: {total_items_mesa1} itens totais")
    print(f"✓ Mesa 2: {total_items_mesa2} itens totais")

    # ===== FASE 5: ATUALIZAÇÃO DE PEDIDOS =====
    print("\n=== FASE 5: Atualizando pedidos ===")

    # Atualizar status do pedido 1 para "finished"
    order1_update = {"status": "finished"}

    response = httpx.put(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order1['id']}",
        json=order1_update,
        headers=waiter_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao atualizar pedido 1: {response.status_code} - {response.text}"
    updated_order1 = response.json()
    assert updated_order1["status"] == "finished"
    print("✓ Pedido 1 atualizado para 'finished'")

    # Testar cancelamento de pedido (apenas admin pode fazer isso)
    order1_cancel = {"status": "cancelled"}

    response = httpx.put(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order1['id']}",
        json=order1_cancel,
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao cancelar pedido 1: {response.status_code} - {response.text}"
    cancelled_order1 = response.json()
    assert cancelled_order1["status"] == "cancelled"
    print("✓ Pedido 1 cancelado (por admin)")

    # Testar novo endpoint de finalização de pedido
    response = httpx.put(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order1['id']}/finish",
        headers=waiter_headers,
    )
    assert (
        response.status_code == 400
    ), f"Erro ao tentar finalizar pedido cancelado: {response.status_code} - {response.text}"
    print("✓ Tentativa de finalizar pedido cancelado rejeitada corretamente")

    # Criar um novo pedido para testar finalização
    order3_data = {
        "comment": "Pedido para teste de finalização",
        "items": [
            {
                "product_id": product1["id"],
                "quantity": 1,
                "unit_price": 6.00,
                "comment": "Teste",
            }
        ],
    }

    response = httpx.post(
        f"{BASE_URL}/orders/{table1['id']}/orders",
        json=order3_data,
        headers=waiter_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pedido 3: {response.status_code} - {response.text}"
    order3 = response.json()
    print(f"✓ Pedido 3 criado (id={order3['id']})")

    # Finalizar o novo pedido
    response = httpx.put(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order3['id']}/finish",
        headers=waiter_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao finalizar pedido 3: {response.status_code} - {response.text}"
    finished_order3 = response.json()
    assert finished_order3["status"] == "finished"
    print("✓ Pedido 3 finalizado com sucesso pelo garçom")

    # ===== FASE 6: ATUALIZAÇÃO DE PRODUTOS =====
    print("\n=== FASE 6: Atualizando produtos ===")

    # Atualizar preço do produto 1
    product1_update = {"price": 6.00}

    response = httpx.patch(
        f"{BASE_URL}/products/{product1['id']}",
        json=product1_update,
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao atualizar produto 1: {response.status_code} - {response.text}"
    updated_product1 = response.json()
    assert updated_product1["price"] == 6.00
    print("✓ Preço do produto 1 atualizado para R$ 6,00")

    # ===== FASE 7: PAGAMENTOS =====
    print("\n=== FASE 7: Testando pagamentos ===")

    # Criar pagamento para o pedido 1
    payment1_data = {
        "method": "card",  # Usar 'method' em vez de 'payment_method'
        "amount_paid": 12.00,  # Usar 'amount_paid' em vez de 'amount'
        "service_tax_included": "no",
        "change": 0.0,
    }

    response = httpx.post(
        f"{BASE_URL}/payments/orders/{order1['id']}/payment",
        json=payment1_data,
        headers=admin_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pagamento 1: {response.status_code} - {response.text}"
    payment1 = response.json()
    assert payment1["amount_paid"] == 12.00
    assert payment1["status"] == "pending"
    print("✓ Pagamento 1 criado com sucesso")

    # Obter pagamento
    response = httpx.get(
        f"{BASE_URL}/payments/orders/{order1['id']}/payment", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao obter pagamento: {response.status_code} - {response.text}"
    payment_detail = response.json()
    assert payment_detail["id"] == payment1["id"]
    print("✓ Pagamento obtido com sucesso")

    # Obter resumo do pagamento
    response = httpx.get(
        f"{BASE_URL}/payments/orders/{order1['id']}/payment/summary",
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao obter resumo do pagamento: {response.status_code} - {response.text}"
    payment_summary = response.json()
    assert "total_amount" in payment_summary
    print("✓ Resumo do pagamento obtido com sucesso")

    # Processar pagamento
    response = httpx.post(
        f"{BASE_URL}/payments/orders/{order1['id']}/payment/process",
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao processar pagamento: {response.status_code} - {response.text}"
    processed_payment = response.json()
    assert processed_payment["status"] == "paid"
    print("✓ Pagamento processado com sucesso")

    # Criar pagamento para o pedido 2
    payment2_data = {
        "method": "cash",
        "amount_paid": 20.00,  # Pagar com dinheiro (mais que o valor)
        "service_tax_included": "no",
        "change": 4.10,  # Troco de R$ 4,10 (20 - 15.90)
    }

    response = httpx.post(
        f"{BASE_URL}/payments/orders/{order2['id']}/payment",
        json=payment2_data,
        headers=admin_headers,
    )
    assert (
        response.status_code == 201
    ), f"Erro ao criar pagamento 2: {response.status_code} - {response.text}"
    payment2 = response.json()
    print("✓ Pagamento 2 criado com sucesso")

    # Cancelar pagamento
    response = httpx.post(
        f"{BASE_URL}/payments/orders/{order2['id']}/payment/cancel",
        headers=admin_headers,
    )
    assert (
        response.status_code == 200
    ), f"Erro ao cancelar pagamento: {response.status_code} - {response.text}"
    cancelled_payment = response.json()
    assert cancelled_payment["status"] == "cancelled"
    print("✓ Pagamento cancelado com sucesso")

    # ===== FASE 8: RELATÓRIOS =====
    print("\n=== FASE 8: Testando relatórios ===")

    # Relatório de produtos mais vendidos
    response = httpx.get(
        f"{BASE_URL}/reports/top-products?limit=5&days=7", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao gerar relatório de produtos: {response.status_code} - {response.text}"
    top_products = response.json()
    assert "products" in top_products
    print("✓ Relatório de produtos mais vendidos gerado com sucesso")

    # Relatório de métodos de pagamento
    response = httpx.get(
        f"{BASE_URL}/reports/payment-methods?days=7", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao gerar relatório de métodos de pagamento: {response.status_code} - {response.text}"
    payment_methods = response.json()
    assert "methods" in payment_methods
    print("✓ Relatório de métodos de pagamento gerado com sucesso")

    # Relatório de performance das mesas
    response = httpx.get(
        f"{BASE_URL}/reports/table-performance?days=7", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao gerar relatório de performance das mesas: {response.status_code} - {response.text}"
    table_performance = response.json()
    assert "tables" in table_performance
    print("✓ Relatório de performance das mesas gerado com sucesso")

    # Relatório de vendas por usuário
    response = httpx.get(
        f"{BASE_URL}/reports/user-sales/{waiter_username}?days=7", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao gerar relatório de vendas por usuário: {response.status_code} - {response.text}"
    user_sales = response.json()
    assert "username" in user_sales
    print("✓ Relatório de vendas por usuário gerado com sucesso")

    # REMOVIDO: Dashboard resumido (endpoint /reports/dashboard)

    # ===== FASE 9: FECHAMENTO DE MESA =====
    print("\n=== FASE 9: Fechando mesa ===")

    # Fechar Mesa 2
    response = httpx.put(
        f"{BASE_URL}/tables/{table2['id']}/close", headers=admin_headers
    )
    assert (
        response.status_code == 200
    ), f"Erro ao fechar mesa 2: {response.status_code} - {response.text}"
    closed_table2 = response.json()
    assert closed_table2["is_closed"] is True
    print("✓ Mesa 2 fechada com sucesso")

    # Verificar mesas fechadas
    response = httpx.get(f"{BASE_URL}/tables/?is_closed=true", headers=waiter_headers)
    assert (
        response.status_code == 200
    ), f"Erro ao listar mesas fechadas: {response.status_code} - {response.text}"
    closed_tables = response.json()
    assert len(closed_tables) >= 1
    print(
        f"✓ Listagem de mesas fechadas: {len(closed_tables)} mesas fechadas encontradas"
    )

    # ===== FASE 10: LIMPEZA E REMOÇÃO =====
    print("\n=== FASE 10: Limpeza e remoção ===")

    # Remover pagamentos
    response = httpx.delete(
        f"{BASE_URL}/payments/orders/{order1['id']}/payment", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover pagamento 1: {response.status_code} - {response.text}"
    print("✓ Pagamento 1 removido com sucesso")

    response = httpx.delete(
        f"{BASE_URL}/payments/orders/{order2['id']}/payment", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover pagamento 2: {response.status_code} - {response.text}"
    print("✓ Pagamento 2 removido com sucesso")

    # Remover pedidos da Mesa 1
    response = httpx.delete(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order1['id']}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover pedido 1: {response.status_code} - {response.text}"
    print("✓ Pedido 1 removido com sucesso")

    response = httpx.delete(
        f"{BASE_URL}/orders/{table1['id']}/orders/{order2['id']}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover pedido 2: {response.status_code} - {response.text}"
    print("✓ Pedido 2 removido com sucesso")

    # Remover pedido da Mesa 2
    response = httpx.delete(
        f"{BASE_URL}/orders/{table2['id']}/orders/{order3['id']}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover pedido 3: {response.status_code} - {response.text}"
    print("✓ Pedido 3 removido com sucesso")

    # Remover mesas
    response = httpx.delete(f"{BASE_URL}/tables/{table1['id']}", headers=admin_headers)
    assert (
        response.status_code == 204
    ), f"Erro ao remover mesa 1: {response.status_code} - {response.text}"
    print("✓ Mesa 1 removida com sucesso")

    response = httpx.delete(f"{BASE_URL}/tables/{table2['id']}", headers=admin_headers)
    assert (
        response.status_code == 204
    ), f"Erro ao remover mesa 2: {response.status_code} - {response.text}"
    print("✓ Mesa 2 removida com sucesso")

    # Remover produtos
    response = httpx.delete(
        f"{BASE_URL}/products/{product1['id']}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover produto 1: {response.status_code} - {response.text}"
    print("✓ Produto 1 removido com sucesso")

    response = httpx.delete(
        f"{BASE_URL}/products/{product2['id']}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover produto 2: {response.status_code} - {response.text}"
    print("✓ Produto 2 removido com sucesso")

    # Remover usuários
    response = httpx.delete(
        f"{BASE_URL}/users/{waiter_username}", headers=admin_headers
    )
    assert (
        response.status_code == 204
    ), f"Erro ao remover garçom: {response.status_code} - {response.text}"
    print("✓ Garçom removido com sucesso")

    response = httpx.delete(f"{BASE_URL}/users/{admin_username}", headers=admin_headers)
    assert (
        response.status_code == 204
    ), f"Erro ao remover admin: {response.status_code} - {response.text}"
    print("✓ Administrador removido com sucesso")

    # Remover quarto
    response = httpx.delete(f"{BASE_URL}/rooms/{room_id}", headers=admin_headers)
    assert (
        response.status_code == 204
    ), f"Erro ao remover quarto: {response.status_code} - {response.text}"
    print("✓ Quarto removido com sucesso")

    print("\n=== TESTE COMPLETO FINALIZADO COM SUCESSO! ===")
    print("✓ Todos os endpoints foram testados")
    print("✓ Todos os dados foram criados e removidos corretamente")
    print("✓ Sistema limpo após o teste")


if __name__ == "__main__":
    test_complete_api_flow()
