#!/usr/bin/env python3
"""
Script para inicializar filas de impressão.

Este script cria a fila padrão se não existir.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.crud import print_queue_config as print_queue_config_crud
from app.db import SessionLocal


def init_print_queues():
    """Inicializa as filas de impressão."""
    db = SessionLocal()
    try:
        # Garantir que sempre existe uma fila padrão
        default_queue = print_queue_config_crud.ensure_default_queue_exists(db)
        print(f"✅ Fila padrão inicializada: {default_queue.name} (ID: {default_queue.id})")
        
        # Listar todas as filas
        all_queues = print_queue_config_crud.get_all_print_queue_configs(db)
        print(f"📋 Total de filas configuradas: {len(all_queues)}")
        
        for queue in all_queues:
            status = "🔵 Padrão" if queue.is_default else "⚪ Normal"
            print(f"  - {queue.name} (ID: {queue.id}) {status}")
            
    except Exception as e:
        print(f"❌ Erro ao inicializar filas de impressão: {e}")
        return False
    finally:
        db.close()
    
    return True


if __name__ == "__main__":
    print("🚀 Inicializando filas de impressão...")
    success = init_print_queues()
    if success:
        print("✅ Inicialização concluída com sucesso!")
    else:
        print("❌ Falha na inicialização!")
        sys.exit(1) 