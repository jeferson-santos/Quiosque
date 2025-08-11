#!/usr/bin/env python3
"""
Script de teste para validação de exclusão de quartos.

Este script demonstra como funciona a validação que impede a exclusão
de quartos que tenham mesas associadas.
"""

import requests
import json
from datetime import datetime

# Configurações
BASE_URL = "http://localhost:8000"
TOKEN = None  # Será obtido após login

def login(username: str, password: str) -> str:
    """Faz login e retorna o token de acesso."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": username, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        return data["access_token"]
    else:
        raise Exception(f"Erro no login: {response.text}")

def list_rooms(token: str):
    """Lista todos os quartos."""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/rooms/",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao listar quartos: {response.text}")
        return []

def get_room_tables(token: str, room_id: int):
    """Obtém as mesas de um quarto."""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/rooms/{room_id}/tables",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao obter mesas: {response.text}")
        return []

def disassociate_room_tables(token: str, room_id: int):
    """Desassocia todas as mesas de um quarto."""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/disassociate-tables",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao desassociar mesas: {response.text}")
        return None

def delete_room(token: str, room_id: int):
    """Tenta excluir um quarto."""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.delete(
        f"{BASE_URL}/rooms/{room_id}",
        headers=headers
    )
    
    if response.status_code == 204:
        return {"success": True, "message": "Quarto excluído com sucesso"}
    else:
        return {"success": False, "error": response.text}

def main():
    """Função principal do script."""
    print("=== Teste de Validação de Exclusão de Quartos ===\n")
    
    # Login
    try:
        print("Fazendo login...")
        token = login("admin", "admin123")  # Ajuste conforme suas credenciais
        print("Login realizado com sucesso!\n")
    except Exception as e:
        print(f"Erro no login: {e}")
        return
    
    # Listar quartos
    print("Listando quartos disponíveis...")
    rooms = list_rooms(token)
    
    if not rooms:
        print("Nenhum quarto encontrado.")
        return
    
    print("Quartos disponíveis:")
    for room in rooms:
        print(f"  ID: {room['id']}, Número: {room['number']}, Status: {room['status']}")
    
    # Escolher um quarto para teste
    room_id = rooms[0]['id'] if rooms else 1
    print(f"\nUsando quarto ID: {room_id}")
    
    # Teste 1: Verificar mesas do quarto
    print("\n" + "="*50)
    print("TESTE 1: VERIFICAR MESAS DO QUARTO")
    print("="*50)
    
    tables = get_room_tables(token, room_id)
    print(f"Mesas associadas ao quarto {room_id}: {len(tables)}")
    
    for table in tables:
        print(f"  - Mesa: {table['name']}, Status: {'Fechada' if table['is_closed'] else 'Ativa'}")
    
    # Teste 2: Tentar excluir quarto com mesas
    print("\n" + "="*50)
    print("TESTE 2: TENTAR EXCLUIR QUARTO COM MESAS")
    print("="*50)
    
    if tables:
        print("Tentando excluir quarto com mesas associadas...")
        result = delete_room(token, room_id)
        
        if not result["success"]:
            print("✅ VALIDAÇÃO FUNCIONANDO: Quarto não pode ser excluído")
            print(f"Erro: {result['error']}")
        else:
            print("❌ VALIDAÇÃO FALHOU: Quarto foi excluído mesmo com mesas")
    else:
        print("Quarto não tem mesas associadas. Testando exclusão...")
        result = delete_room(token, room_id)
        
        if result["success"]:
            print("✅ Quarto excluído com sucesso (não tinha mesas)")
        else:
            print(f"❌ Erro ao excluir quarto: {result['error']}")
    
    # Teste 3: Desassociar mesas (se existirem)
    if tables:
        print("\n" + "="*50)
        print("TESTE 3: DESASSOCIAR MESAS DO QUARTO")
        print("="*50)
        
        print("Desassociando mesas do quarto...")
        disassociate_result = disassociate_room_tables(token, room_id)
        
        if disassociate_result:
            print("✅ Mesas desassociadas com sucesso!")
            print(f"Mensagem: {disassociate_result['message']}")
            print(f"Mesas desassociadas: {disassociate_result['tables_disassociated']}")
            
            # Verificar se as mesas foram realmente desassociadas
            tables_after = get_room_tables(token, room_id)
            print(f"Mesas após desassociação: {len(tables_after)}")
            
            # Teste 4: Tentar excluir quarto após desassociação
            print("\n" + "="*50)
            print("TESTE 4: TENTAR EXCLUIR QUARTO APÓS DESASSOCIAÇÃO")
            print("="*50)
            
            result = delete_room(token, room_id)
            
            if result["success"]:
                print("✅ Quarto excluído com sucesso após desassociação!")
            else:
                print(f"❌ Erro ao excluir quarto: {result['error']}")
        else:
            print("❌ Erro ao desassociar mesas")
    
    print("\n=== Teste concluído ===")

if __name__ == "__main__":
    main() 