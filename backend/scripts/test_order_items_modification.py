#!/usr/bin/env python3
"""
Script para testar a modificação de itens em orders.
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
        "comment": "Pedido de teste para modificação",
        "items": [
            {
                "product_id": 1,
                "quantity": 2,
                "unit_price": 10.50,
                "comment": "Item inicial"
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

def test_order_items_modification():
    """Testa a modificação de itens em orders."""
    print("=== Teste de Modificação de Itens em Orders ===\n")
    
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
        initial_item_id = test_order["items"][0]["id"]
        print(f"✓ Pedido criado: ID {order_id}, Mesa {table_id}")
        print(f"  Item inicial: ID {initial_item_id}, Quantidade: {test_order['items'][0]['quantity']}\n")
        
        # 3. Testar adição de item por administrador
        print("3. Testando adição de item por administrador...")
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        add_item_data = {
            "items_actions": [
                {
                    "action": "add",
                    "product_id": 2,
                    "quantity": 1,
                    "unit_price": 15.00,
                    "comment": "Item adicionado"
                }
            ]
        }
        
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
            headers=headers,
            json=add_item_data
        )
        
        if response.status_code == 200:
            updated_order = response.json()
            print(f"✓ Item adicionado com sucesso!")
            print(f"  Total de itens após adição: {len(updated_order['items'])}")
        else:
            print(f"✗ Falha ao adicionar item: {response.status_code} - {response.text}")
        
        print()
        
        # 4. Testar atualização de quantidade por administrador
        print("4. Testando atualização de quantidade por administrador...")
        
        update_item_data = {
            "items_actions": [
                {
                    "action": "update",
                    "item_id": initial_item_id,
                    "quantity": 3,
                    "comment": "Quantidade atualizada"
                }
            ]
        }
        
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
            headers=headers,
            json=update_item_data
        )
        
        if response.status_code == 200:
            updated_order = response.json()
            print(f"✓ Quantidade atualizada com sucesso!")
            for item in updated_order["items"]:
                if item["id"] == initial_item_id:
                    print(f"  Nova quantidade: {item['quantity']}")
                    break
        else:
            print(f"✗ Falha ao atualizar quantidade: {response.status_code} - {response.text}")
        
        print()
        
        # 5. Testar remoção de item por administrador
        print("5. Testando remoção de item por administrador...")
        
        # Primeiro, obter o pedido atualizado para pegar o ID do segundo item
        response = requests.get(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            current_order = response.json()
            second_item_id = None
            for item in current_order["items"]:
                if item["id"] != initial_item_id:
                    second_item_id = item["id"]
                    break
            
            if second_item_id:
                remove_item_data = {
                    "items_actions": [
                        {
                            "action": "remove",
                            "item_id": second_item_id
                        }
                    ]
                }
                
                response = requests.put(
                    f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
                    headers=headers,
                    json=remove_item_data
                )
                
                if response.status_code == 200:
                    updated_order = response.json()
                    print(f"✓ Item removido com sucesso!")
                    print(f"  Total de itens após remoção: {len(updated_order['items'])}")
                else:
                    print(f"✗ Falha ao remover item: {response.status_code} - {response.text}")
            else:
                print("✗ Não foi possível encontrar o segundo item para remoção")
        else:
            print(f"✗ Falha ao obter pedido atual: {response.status_code} - {response.text}")
        
        print()
        
        # 6. Testar modificação por garçom (deve falhar)
        print("6. Testando modificação por garçom (deve falhar)...")
        headers = {"Authorization": f"Bearer {waiter_token}"}
        
        waiter_modify_data = {
            "items_actions": [
                {
                    "action": "add",
                    "product_id": 3,
                    "quantity": 1,
                    "unit_price": 20.00,
                    "comment": "Tentativa de garçom"
                }
            ]
        }
        
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
            headers=headers,
            json=waiter_modify_data
        )
        
        if response.status_code == 403:
            print("✓ Corretamente bloqueado: Garçons não podem modificar itens")
        else:
            print(f"✗ Erro: Deveria ter sido bloqueado, mas retornou {response.status_code}")
        
        print()
        
        # 7. Testar múltiplas ações simultâneas
        print("7. Testando múltiplas ações simultâneas...")
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Obter pedido atual
        response = requests.get(
            f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            current_order = response.json()
            current_item_id = current_order["items"][0]["id"]
            
            multiple_actions_data = {
                "comment": "Pedido com múltiplas modificações",
                "items_actions": [
                    {
                        "action": "update",
                        "item_id": current_item_id,
                        "quantity": 5,
                        "comment": "Quantidade aumentada"
                    },
                    {
                        "action": "add",
                        "product_id": 3,
                        "quantity": 2,
                        "unit_price": 25.00,
                        "comment": "Novo item"
                    }
                ]
            }
            
            response = requests.put(
                f"{BASE_URL}/orders/{table_id}/orders/{order_id}",
                headers=headers,
                json=multiple_actions_data
            )
            
            if response.status_code == 200:
                updated_order = response.json()
                print(f"✓ Múltiplas ações executadas com sucesso!")
                print(f"  Total de itens: {len(updated_order['items'])}")
                print(f"  Comentário atualizado: {updated_order['comment']}")
            else:
                print(f"✗ Falha nas múltiplas ações: {response.status_code} - {response.text}")
        else:
            print(f"✗ Falha ao obter pedido: {response.status_code} - {response.text}")
        
        print()
        
        # 8. Testar modificação de itens em pedido finalizado por administrador
        print("8. Testando modificação de itens em pedido finalizado por administrador...")
        
        # Criar novo pedido e finalizar
        new_order = create_test_order(admin_token)
        new_order_id = new_order["id"]
        
        # Finalizar o pedido
        response = requests.put(
            f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}/finish",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✓ Pedido finalizado")
            
            # Tentar adicionar item ao pedido finalizado
            add_to_finished_data = {
                "items_actions": [
                    {
                        "action": "add",
                        "product_id": 4,
                        "quantity": 1,
                        "unit_price": 30.00,
                        "comment": "Item adicionado a pedido finalizado"
                    }
                ]
            }
            
            response = requests.put(
                f"{BASE_URL}/orders/{table_id}/orders/{new_order_id}",
                headers=headers,
                json=add_to_finished_data
            )
            
            if response.status_code == 200:
                updated_order = response.json()
                print("✓ Administrador pode modificar itens de pedido finalizado!")
                print(f"  Total de itens: {len(updated_order['items'])}")
            else:
                print(f"✗ Falha ao modificar pedido finalizado: {response.status_code} - {response.text}")
        else:
            print(f"✗ Falha ao finalizar pedido: {response.status_code} - {response.text}")
        
        print("\n=== Teste Concluído ===")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")

if __name__ == "__main__":
    test_order_items_modification() 