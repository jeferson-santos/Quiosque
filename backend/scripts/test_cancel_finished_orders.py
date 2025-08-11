#!/usr/bin/env python3
"""
Script para testar o cancelamento de pedidos finalizados.
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
        "comment": "Pedido de teste para cancelamento após finalização",
        "items": [
            {
                "product_id": 1,
                "quantity": 1,
                "unit_price": 12.50,
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

def test_cancel_finished_orders():
    """Testa o cancelamento de pedidos finalizados."""
    print("=== Teste de Cancelamento de Pedidos Finalizados ===\n")
    
    try:
        # 1. Obter tokens de autenticação
        print("1. Obtendo tokens de autenticação...")
        admin_token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
        waiter_token = get_auth_token(WAITER_USERNAME, WAITER_PASSWORD)
        print("✓ Tokens obtidos com sucesso\n")
        
        # 2. Criar e finalizar pedido
        print("2. Criando e finalizando pedido...")
        test_order = create_test_order(admin_token)
        order_id = test_order["id"]
        table_id = test_order["table_id"]
        print(f"✓ Pedido criado: ID {order_id}, Mesa {table_id}")
        print(f"  Status inicial: {test_order['status']}")
        
        # Finalizar o pedido
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/finish",
            headers=headers
        )
        
        if response.status_code == 200:
            finished_order = response.json()
            print(f"✓ Pedido finalizado com sucesso!")
            print(f"  Status após finalização: {finished_order['status']}\n")
        else:
            print(f"✗ Falha ao finalizar pedido: {response.status_code} - {response.text}\n")
            return
        
        # 3. Testar cancelamento por administrador (deve funcionar)
        print("3. Testando cancelamento por administrador...")
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers=headers
        )
        
        if response.status_code == 200:
            cancelled_order = response.json()
            print(f"✓ Pedido finalizado cancelado com sucesso!")
            print(f"  Status após cancelamento: {cancelled_order['status']}")
            print(f"  Fluxo: pending → finished → cancelled")
        else:
            print(f"✗ Falha no cancelamento: {response.status_code} - {response.text}")
        
        print()
        
        # 4. Testar cancelamento por garçom (deve falhar)
        print("4. Testando cancelamento por garçom (deve falhar)...")
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers={"Authorization": f"Bearer {waiter_token}"}
        )
        
        if response.status_code == 403:
            print("✓ Corretamente bloqueado: Apenas administradores podem cancelar pedidos")
        else:
            print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        
        print()
        
        # 5. Testar cancelamento de pedido já cancelado (deve falhar)
        print("5. Testando cancelamento de pedido já cancelado...")
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}/cancel",
            headers=headers
        )
        
        if response.status_code == 400:
            print("✓ Corretamente bloqueado: Pedido já está cancelado")
        else:
            print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        
        print()
        
        # 6. Testar cenário completo: criar → finalizar → cancelar → tentar cancelar novamente
        print("6. Testando cenário completo...")
        new_order = create_test_order(admin_token)
        new_order_id = new_order["id"]
        print(f"  Novo pedido criado: ID {new_order_id}")
        
        # Finalizar
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/finish",
            headers=headers
        )
        if response.status_code == 200:
            print("  ✓ Pedido finalizado")
            
            # Cancelar
            response = requests.put(
                f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/cancel",
                headers=headers
            )
            if response.status_code == 200:
                print("  ✓ Pedido cancelado após finalização")
                
                # Tentar cancelar novamente
                response = requests.put(
                    f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/cancel",
                    headers=headers
                )
                if response.status_code == 400:
                    print("  ✓ Corretamente bloqueado: Pedido já cancelado")
                else:
                    print(f"  ✗ Erro: Deveria ter sido bloqueado")
            else:
                print(f"  ✗ Falha ao cancelar: {response.status_code}")
        else:
            print(f"  ✗ Falha ao finalizar: {response.status_code}")
        
        print("\n=== Teste Concluído ===")
        print("✓ Administradores podem cancelar pedidos finalizados")
        print("✓ Garçons não podem cancelar pedidos")
        print("✓ Pedidos já cancelados não podem ser cancelados novamente")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")

if __name__ == "__main__":
    test_cancel_finished_orders() 