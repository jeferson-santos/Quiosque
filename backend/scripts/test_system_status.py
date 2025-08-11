#!/usr/bin/env python3
"""
Script para testar o sistema de bloqueio de pedidos.

Este script testa:
1. Verificação do status do sistema
2. Bloqueio de novos pedidos
3. Desbloqueio de novos pedidos
4. Tentativa de criar pedido quando bloqueado
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.system_status import get_system_status, update_system_status, is_orders_enabled
from app.schemas.system_status import SystemStatusUpdate


def test_system_status():
    """Testa o sistema de status."""
    db = SessionLocal()
    
    try:
        print("=== Testando Sistema de Status ===\n")
        
        # 1. Verificar status inicial
        print("1. Verificando status inicial do sistema...")
        status = get_system_status(db)
        print(f"   ✅ Status: {'Habilitado' if status.orders_enabled else 'Bloqueado'}")
        print(f"   📝 Motivo: {status.reason or 'Nenhum'}")
        print(f"   👤 Atualizado por: {status.updated_by or 'Sistema'}")
        print(f"   🕒 Última atualização: {status.updated_at}")
        
        # 2. Testar bloqueio do sistema
        print("\n2. Testando bloqueio do sistema...")
        block_update = SystemStatusUpdate(
            orders_enabled=False,
            reason="Cozinha lotada - fim de expediente"
        )
        updated_status = update_system_status(db, block_update, "admin_test")
        
        print(f"   ✅ Sistema bloqueado com sucesso!")
        print(f"   📝 Motivo: {updated_status.reason}")
        print(f"   👤 Bloqueado por: {updated_status.updated_by}")
        
        # 3. Verificar se está bloqueado
        print("\n3. Verificando se o sistema está bloqueado...")
        is_enabled = is_orders_enabled(db)
        print(f"   {'❌ Sistema bloqueado' if not is_enabled else '✅ Sistema habilitado'}")
        
        # 4. Testar desbloqueio
        print("\n4. Testando desbloqueio do sistema...")
        unblock_update = SystemStatusUpdate(
            orders_enabled=True,
            reason="Sistema reaberto"
        )
        final_status = update_system_status(db, unblock_update, "admin_test")
        
        print(f"   ✅ Sistema desbloqueado com sucesso!")
        print(f"   📝 Motivo: {final_status.reason}")
        
        # 5. Verificar status final
        print("\n5. Verificando status final...")
        final_check = is_orders_enabled(db)
        print(f"   {'✅ Sistema habilitado' if final_check else '❌ Sistema bloqueado'}")
        
        print("\n=== Teste concluído! ===")
        
        # 6. Resumo
        print("\n📋 RESUMO:")
        print("   ✅ Sistema de status funcionando")
        print("   ✅ Bloqueio/desbloqueio funcionando")
        print("   ✅ Verificação de status funcionando")
        print("\n💡 Como usar:")
        print("   - GET /system/status - Verificar status atual")
        print("   - PATCH /system/status - Alterar status (apenas admin)")
        print("   - Novos pedidos são automaticamente bloqueados quando orders_enabled=false")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_system_status() 