#!/usr/bin/env python3
"""
Script para testar o endpoint de cancelamento de orders.
"""

import requests
import json
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
WAITER_USERNAME = "waiter"
WAITER_PASSWORD = "waiter123"

def get_auth_token(username: str, password: str) -> str:
    """Obtém token de autenticação."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"Falha na autenticação: {response.text}")

def create_test_order(token: str, table_id: int = 1) -> dict:
    """Cria um pedido de teste."""
    headers = {"Authorization": f"Bearer {token}"}
    
    order_data = {
        "comment": "Pedido de teste para cancelamento",
        "items": [
            {
                "product_id": 1,
                "quantity": 2,
                "unit_price": 10.50,
                "comment": "Item de teste"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/orders/{table_id}/orders",
        headers=headers,
        json=order_data
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        raise Exception(f"Falha ao criar pedido: {response.text}")

def test_cancel_order():
    """Testa o endpoint de cancelamento de orders."""
    print("=== Teste do Endpoint de Cancelamento de Orders ===\n")
    
    try:
        # 1. Obter tokens de autenticação
        print("1. Obtendo tokens de autenticação...")
        admin_token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        waiter_token = get_auth_token(WAITER_USERNAME, WAITER_PASSWORD)
        print("✓ Tokens obtidos com sucesso\n")
        
        # 2. Criar pedido de teste
        print("2. Criando pedido de teste...")
        test_order = create_test_order(admin_token)
        order_id = test_order["id"]
        table_id = test_order["table_id"]
        print(f"✓ Pedido criado: ID {order_id}, Mesa {table_id}")
        print(f"  Status inicial: {test_order['status']}\n")
        
        # 3. Testar cancelamento por administrador (deve funcionar)
        print("3. Testando cancelamento por administrador...")
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers=headers
        )
        
        if response.status_code == 200:
            cancelled_order = response.json()
            print(f"✓ Pedido cancelado com sucesso!")
            print(f"  Status após cancelamento: {cancelled_order['status']}")
        else:
            print(f"✗ Falha no cancelamento: {response.status_code} - {response.text}")
        
        print()
        
        # 4. Testar cancelamento por garçom (deve falhar)
        print("4. Testando cancelamento por garçom (deve falhar)...")
        headers = {"Authorization": f"Bearer {waiter_token}"}
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers=headers
        )
        
        if response.status_code == 403:
            print("✓ Corretamente bloqueado: Apenas administradores podem cancelar pedidos")
        else:
            print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        
        print()
        
        # 5. Testar cancelamento de pedido já cancelado (deve falhar)
        print("5. Testando cancelamento de pedido já cancelado...")
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers=headers
        )
        
        if response.status_code == 400:
            print("✓ Corretamente bloqueado: Pedido já está cancelado")
        else:
            print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        
        print()
        
        # 6. Criar novo pedido e finalizar, depois tentar cancelar (deve funcionar para admin)
        print("6. Testando cancelamento de pedido finalizado por administrador...")
        new_order = create_test_order(admin_token)
        new_order_id = new_order["id"]
        
        # Finalizar o pedido
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/finish",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✓ Pedido finalizado")
            
            # Tentar cancelar pedido finalizado (deve funcionar para admin)
            response = requests.put(
                f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/cancel",
                headers=headers
            )
            
            if response.status_code == 200:
                cancelled_order = response.json()
                print("✓ Administrador pode cancelar pedido finalizado!")
                print(f"  Status após cancelamento: {cancelled_order['status']}")
            else:
                print(f"✗ Erro: Deveria ter funcionado, mas retornou {response.status_code} - {response.text}")
        else:
            print(f"✗ Falha ao finalizar pedido: {response.text}")
        
        print()
        
        # 7. Testar cancelamento de pedido finalizado por garçom (deve falhar)
        print("7. Testando cancelamento de pedido finalizado por garçom (deve falhar)...")
        new_order2 = create_test_order(admin_token)
        new_order2_id = new_order2["id"]
        
        # Finalizar o pedido
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{new_order2_id}/finish",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if response.status_code == 200:
            print("✓ Pedido finalizado")
            
            # Tentar cancelar pedido finalizado por garçom
            response = requests.put(
                f"{BASE_URL}/orders/{table_id}/orders/{new_order2_id}/cancel",
                headers={"Authorization": f"Bearer {waiter_token}"}
            )
            
            if response.status_code == 403:
                print("✓ Corretamente bloqueado: Garçons não podem cancelar pedidos")
            else:
                print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        else:
            print(f"✗ Falha ao finalizar pedido: {response.text}")
        
        print("\n=== Teste Concluído ===")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")

if __name__ == "__main__":
    test_cancel_order() 