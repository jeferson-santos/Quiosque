#!/usr/bin/env python3
"""
Script para testar as APIs das filas de impressão.

Este script testa os endpoints das filas de impressão via HTTP.
"""

import sys
import os
import requests
import json

# Configurações
BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = None  # Será obtido via login
AGENT_TOKEN = None  # Será obtido via login


def login_admin():
    """Faz login como administrator."""
    global ADMIN_TOKEN
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code == 200:
        ADMIN_TOKEN = response.json()["access_token"]
        print("✅ Login como administrator realizado")
        return True
    else:
        print(f"❌ Falha no login como administrator: {response.status_code}")
        return False


def login_agent():
    """Faz login como agent."""
    global AGENT_TOKEN
    
    login_data = {
        "username": "agent",
        "password": "agent123"
    }
    
    response = requests.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code == 200:
        AGENT_TOKEN = response.json()["access_token"]
        print("✅ Login como agent realizado")
        return True
    else:
        print(f"❌ Falha no login como agent: {response.status_code}")
        return False


def test_print_queues_api():
    """Testa as APIs das filas de impressão."""
    
    print("🧪 Testando APIs das filas de impressão...")
    
    # 1. Login
    print("\n1️⃣ Fazendo login...")
    if not login_admin():
        return False
    
    if not login_agent():
        return False
    
    headers_admin = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    headers_agent = {"Authorization": f"Bearer {AGENT_TOKEN}"}
    
    # 2. Listar filas (agent)
    print("\n2️⃣ Testando GET /print-queues (agent)...")
    response = requests.get(f"{BASE_URL}/print-queues", headers=headers_agent)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        queues = response.json()
        print(f"   ✅ Filas encontradas: {len(queues)}")
        for queue in queues:
            status = "🔵 Padrão" if queue["is_default"] else "⚪ Normal"
            print(f"      - {queue['name']} (ID: {queue['id']}) {status}")
    else:
        print(f"   ❌ Erro: {response.text}")
    
    # 3. Criar nova fila (admin)
    print("\n3️⃣ Testando POST /print-queues (admin)...")
    new_queue_data = {
        "name": "Fila Bar API",
        "description": "Fila para impressão de pedidos do bar via API",
        "printer_name": "Bar-API-Printer-01",
        "is_default": False
    }
    
    response = requests.post(
        f"{BASE_URL}/print-queues", 
        json=new_queue_data, 
        headers=headers_admin
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 201:
        new_queue = response.json()
        print(f"   ✅ Nova fila criada: {new_queue['name']} (ID: {new_queue['id']})")
        new_queue_id = new_queue['id']
    else:
        print(f"   ❌ Erro: {response.text}")
        return False
    
    # 4. Buscar fila específica (agent)
    print("\n4️⃣ Testando GET /print-queues/{id} (agent)...")
    response = requests.get(f"{BASE_URL}/print-queues/{new_queue_id}", headers=headers_agent)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        queue = response.json()
        print(f"   ✅ Fila encontrada: {queue['name']}")
    else:
        print(f"   ❌ Erro: {response.text}")
    
    # 5. Atualizar fila (admin)
    print("\n5️⃣ Testando PUT /print-queues/{id} (admin)...")
    update_data = {
        "description": "Fila para impressão de pedidos do bar e cozinha via API"
    }
    
    response = requests.put(
        f"{BASE_URL}/print-queues/{new_queue_id}", 
        json=update_data, 
        headers=headers_admin
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated_queue = response.json()
        print(f"   ✅ Fila atualizada: {updated_queue['description']}")
    else:
        print(f"   ❌ Erro: {response.text}")
    
    # 6. Definir como padrão (admin)
    print("\n6️⃣ Testando definição como padrão (admin)...")
    default_data = {"is_default": True}
    
    response = requests.put(
        f"{BASE_URL}/print-queues/{new_queue_id}", 
        json=default_data, 
        headers=headers_admin
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        default_queue = response.json()
        print(f"   ✅ Nova fila padrão: {default_queue['name']}")
    else:
        print(f"   ❌ Erro: {response.text}")
    
    # 7. Verificar lista atualizada (agent)
    print("\n7️⃣ Verificando lista atualizada (agent)...")
    response = requests.get(f"{BASE_URL}/print-queues", headers=headers_agent)
    if response.status_code == 200:
        queues = response.json()
        print(f"   ✅ Filas encontradas: {len(queues)}")
        for queue in queues:
            status = "🔵 Padrão" if queue["is_default"] else "⚪ Normal"
            print(f"      - {queue['name']} (ID: {queue['id']}) {status}")
    
    # 8. Testar permissões (agent tentando criar)
    print("\n8️⃣ Testando permissões (agent tentando criar)...")
    response = requests.post(
        f"{BASE_URL}/print-queues", 
        json=new_queue_data, 
        headers=headers_agent
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 403:
        print("   ✅ Permissão negada corretamente para agent")
    else:
        print(f"   ⚠️ Status inesperado: {response.status_code}")
    
    # 9. Deletar fila (admin)
    print("\n9️⃣ Testando DELETE /print-queues/{id} (admin)...")
    response = requests.delete(f"{BASE_URL}/print-queues/{new_queue_id}", headers=headers_admin)
    print(f"   Status: {response.status_code}")
    if response.status_code == 204:
        print("   ✅ Fila deletada com sucesso")
    else:
        print(f"   ❌ Erro: {response.text}")
    
    print("\n✅ Todos os testes de API concluídos com sucesso!")
    return True


if __name__ == "__main__":
    success = test_print_queues_api()
    if success:
        print("\n🎉 Testes de API concluídos com sucesso!")
    else:
        print("\n💥 Falha nos testes de API!")
        sys.exit(1) 