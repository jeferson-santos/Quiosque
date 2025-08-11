#!/usr/bin/env python3
"""
Script de teste para endpoint de mesas de um quarto.

Este script demonstra como usar o endpoint para buscar todas as mesas de um quarto.
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

def get_room_tables(token: str, room_id: int):
    """Obtém todas as mesas de um quarto."""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/rooms/{room_id}/tables",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao obter mesas: {response.text}")
        return None

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

def main():
    """Função principal do script."""
    print("=== Teste de Mesas de um Quarto ===\n")
    
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
    
    # Buscar mesas do quarto
    print(f"\nBuscando mesas do quarto {room_id}...")
    tables = get_room_tables(token, room_id)
    
    if tables:
        print(f"Encontradas {len(tables)} mesas no quarto:")
        for table in tables:
            print(f"  Mesa: {table['name']}")
            print(f"    ID: {table['id']}")
            print(f"    Status: {'Fechada' if table['is_closed'] else 'Ativa'}")
            print(f"    Criada por: {table['created_by']}")
            print(f"    Criada em: {table['created_at']}")
            if table['closed_at']:
                print(f"    Fechada em: {table['closed_at']}")
            print()
    else:
        print("Nenhuma mesa encontrada para este quarto.")
    
    print("=== Teste concluído ===")

if __name__ == "__main__":
    main() 