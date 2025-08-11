#!/usr/bin/env python3
"""
Script para inicializar o sistema de status.

Este script cria o registro inicial do status do sistema.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.system_status import get_system_status


def init_system_status():
    """Inicializa o sistema de status."""
    db = SessionLocal()
    
    try:
        print("=== Inicializando Sistema de Status ===\n")
        
        # Buscar ou criar status inicial
        print("1. Verificando status inicial...")
        status = get_system_status(db)
        
        print(f"   ✅ Sistema inicializado com sucesso!")
        print(f"   📋 Status: {'Habilitado' if status.orders_enabled else 'Bloqueado'}")
        print(f"   📝 Motivo: {status.reason or 'Nenhum'}")
        print(f"   👤 Atualizado por: {status.updated_by or 'Sistema'}")
        print(f"   🕒 Criado em: {status.updated_at}")
        
        print("\n=== Inicialização concluída! ===")
        print("\n💡 Endpoints disponíveis:")
        print("   - GET /system/status - Verificar status")
        print("   - PATCH /system/status - Alterar status (apenas admin)")
        print("\n💡 Para testar:")
        print("   python scripts/test_system_status.py")
        
    except Exception as e:
        print(f"❌ Erro durante inicialização: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_system_status() 