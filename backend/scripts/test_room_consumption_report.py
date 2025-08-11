#!/usr/bin/env python3
"""
Script de teste para relatório de consumo do quarto.

Este script demonstra como usar a funcionalidade de relatório de consumo do quarto.
"""

import requests
import json
from datetime import datetime, timedelta

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

def get_room_consumption_report(token: str, room_id: int, date: str = None, include_all_tables: bool = False):
    """Obtém o relatório de consumo do quarto."""
    headers = {"Authorization": f"Bearer {token}"}
    
    params = {"include_all_tables": include_all_tables}
    if date:
        params["date"] = date
    
    response = requests.get(
        f"{BASE_URL}/rooms/{room_id}/consumption-report",
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao obter relatório: {response.text}")
        return None

def print_room_consumption_report(token: str, room_id: int, date: str = None, include_all_tables: bool = False):
    """Adiciona relatório de consumo à fila de impressão."""
    headers = {"Authorization": f"Bearer {token}"}
    
    params = {"include_all_tables": include_all_tables}
    if date:
        params["date"] = date
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/print-consumption-report",
        headers=headers,
        params=params
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao imprimir relatório: {response.text}")
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
    print("=== Teste de Relatório de Consumo do Quarto ===\n")
    
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
    
    # Data de hoje
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"Data: {today}")
    
    # Teste 1: Relatório com data específica (apenas mesas com pedidos)
    print("\n" + "="*50)
    print("TESTE 1: RELATÓRIO COM DATA ESPECÍFICA (APENAS MESAS COM PEDIDOS)")
    print("="*50)
    
    report = get_room_consumption_report(token, room_id, today, include_all_tables=False)
    
    if report:
        print("Relatório obtido com sucesso!")
        print(f"Quarto: {report['room_number']}")
        print(f"Data: {report['date']}")
        print(f"Total de mesas fechadas: {report['total_tables']}")
        print(f"Total de pedidos: {report['total_orders']}")
        print(f"Receita total: R$ {report['total_revenue']:.2f}")
        print(f"Total de itens: {report['total_items']}")
        print(f"Incluir todas as mesas: {report.get('include_all_tables', False)}")
    
    # Teste 2: Relatório com data específica (todas as mesas fechadas)
    print("\n" + "="*50)
    print("TESTE 2: RELATÓRIO COM DATA ESPECÍFICA (TODAS AS MESAS FECHADAS)")
    print("="*50)
    
    report_all_tables = get_room_consumption_report(token, room_id, today, include_all_tables=True)
    
    if report_all_tables:
        print("Relatório com todas as mesas obtido com sucesso!")
        print(f"Quarto: {report_all_tables['room_number']}")
        print(f"Data: {report_all_tables['date']}")
        print(f"Total de mesas fechadas: {report_all_tables['total_tables']}")
        print(f"Total de pedidos: {report_all_tables['total_orders']}")
        print(f"Receita total: R$ {report_all_tables['total_revenue']:.2f}")
        print(f"Total de itens: {report_all_tables['total_items']}")
        print(f"Incluir todas as mesas: {report_all_tables.get('include_all_tables', False)}")
    
    # Teste 3: Relatório com data atual (sem especificar data)
    print("\n" + "="*50)
    print("TESTE 3: RELATÓRIO COM DATA ATUAL (SEM ESPECIFICAR)")
    print("="*50)
    
    report_current = get_room_consumption_report(token, room_id)
    
    if report_current:
        print("Relatório com data atual obtido com sucesso!")
        print(f"Quarto: {report_current['room_number']}")
        print(f"Data: {report_current['date']}")
        print(f"Total de mesas fechadas: {report_current['total_tables']}")
        print(f"Total de pedidos: {report_current['total_orders']}")
        print(f"Receita total: R$ {report_current['total_revenue']:.2f}")
        print(f"Total de itens: {report_current['total_items']}")
    
    # Teste 4: Imprimir relatório com data específica (apenas mesas com pedidos)
    print("\n" + "="*50)
    print("TESTE 4: IMPRIMIR RELATÓRIO COM DATA ESPECÍFICA (APENAS MESAS COM PEDIDOS)")
    print("="*50)
    
    print_result = print_room_consumption_report(token, room_id, today, include_all_tables=False)
    
    if print_result:
        print("Relatório adicionado à fila de impressão!")
        print(f"ID da fila: {print_result['print_queue_id']}")
        print(f"Data: {print_result['date']}")
        print(f"Incluir todas as mesas: {print_result.get('include_all_tables', False)}")
    
    # Teste 5: Imprimir relatório com data específica (todas as mesas fechadas)
    print("\n" + "="*50)
    print("TESTE 5: IMPRIMIR RELATÓRIO COM DATA ESPECÍFICA (TODAS AS MESAS FECHADAS)")
    print("="*50)
    
    print_result_all_tables = print_room_consumption_report(token, room_id, today, include_all_tables=True)
    
    if print_result_all_tables:
        print("Relatório com todas as mesas adicionado à fila de impressão!")
        print(f"ID da fila: {print_result_all_tables['print_queue_id']}")
        print(f"Data: {print_result_all_tables['date']}")
        print(f"Incluir todas as mesas: {print_result_all_tables.get('include_all_tables', False)}")
    
    # Teste 6: Imprimir relatório com data atual
    print("\n" + "="*50)
    print("TESTE 6: IMPRIMIR RELATÓRIO COM DATA ATUAL")
    print("="*50)
    
    print_result_current = print_room_consumption_report(token, room_id)
    
    if print_result_current:
        print("Relatório com data atual adicionado à fila de impressão!")
        print(f"ID da fila: {print_result_current['print_queue_id']}")
        print(f"Data: {print_result_current['date']}")
    
    print("\n=== Teste concluído ===")

if __name__ == "__main__":
    main() 