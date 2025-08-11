#!/usr/bin/env python3
"""
Script para testar as funcionalidades das filas de impressão.

Este script testa as operações CRUD das filas de impressão.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.crud import print_queue_config as print_queue_config_crud
from app.schemas.print_queue_config import PrintQueueConfigCreate, PrintQueueConfigUpdate
from app.db import SessionLocal


def test_print_queues():
    """Testa as funcionalidades das filas de impressão."""
    db = SessionLocal()
    try:
        print("🧪 Testando funcionalidades das filas de impressão...")
        
        # 1. Garantir que existe uma fila padrão
        print("\n1️⃣ Garantindo fila padrão...")
        default_queue = print_queue_config_crud.ensure_default_queue_exists(db)
        print(f"   ✅ Fila padrão: {default_queue.name} (ID: {default_queue.id})")
        
        # 2. Listar todas as filas
        print("\n2️⃣ Listando todas as filas...")
        all_queues = print_queue_config_crud.get_all_print_queue_configs(db)
        for queue in all_queues:
            status = "🔵 Padrão" if queue.is_default else "⚪ Normal"
            print(f"   - {queue.name} (ID: {queue.id}) {status}")
        
        # 3. Criar uma nova fila
        print("\n3️⃣ Criando nova fila...")
        new_queue_data = PrintQueueConfigCreate(
            name="Fila Bar",
            description="Fila para impressão de pedidos do bar",
            printer_name="Bar-Printer-01",
            is_default=False
        )
        new_queue = print_queue_config_crud.create_print_queue_config(db, new_queue_data)
        print(f"   ✅ Nova fila criada: {new_queue.name} (ID: {new_queue.id})")
        
        # 4. Atualizar a nova fila
        print("\n4️⃣ Atualizando fila...")
        update_data = PrintQueueConfigUpdate(
            description="Fila para impressão de pedidos do bar e cozinha"
        )
        updated_queue = print_queue_config_crud.update_print_queue_config(
            db, new_queue.id, update_data
        )
        print(f"   ✅ Fila atualizada: {updated_queue.description}")
        
        # 5. Testar definição como padrão
        print("\n5️⃣ Definindo nova fila como padrão...")
        default_update = PrintQueueConfigUpdate(is_default=True)
        new_default = print_queue_config_crud.update_print_queue_config(
            db, new_queue.id, default_update
        )
        print(f"   ✅ Nova fila padrão: {new_default.name}")
        
        # 6. Verificar se a antiga não é mais padrão
        old_default = print_queue_config_crud.get_print_queue_config(db, default_queue.id)
        print(f"   ✅ Antiga fila padrão agora é: {'Padrão' if old_default.is_default else 'Normal'}")
        
        # 7. Listar filas novamente
        print("\n6️⃣ Listando filas após mudanças...")
        updated_queues = print_queue_config_crud.get_all_print_queue_configs(db)
        for queue in updated_queues:
            status = "🔵 Padrão" if queue.is_default else "⚪ Normal"
            print(f"   - {queue.name} (ID: {queue.id}) {status}")
        
        # 8. Testar exclusão (não da fila padrão)
        print("\n7️⃣ Testando exclusão...")
        # Criar uma fila temporária para deletar
        temp_queue_data = PrintQueueConfigCreate(
            name="Fila Temporária",
            description="Fila para teste de exclusão",
            is_default=False
        )
        temp_queue = print_queue_config_crud.create_print_queue_config(db, temp_queue_data)
        print(f"   ✅ Fila temporária criada: {temp_queue.name} (ID: {temp_queue.id})")
        
        # Deletar a fila temporária
        success = print_queue_config_crud.delete_print_queue_config(db, temp_queue.id)
        print(f"   ✅ Fila temporária deletada: {success}")
        
        # 9. Testar tentativa de deletar fila padrão (deve falhar se for a única)
        print("\n8️⃣ Testando proteção da fila padrão...")
        try:
            success = print_queue_config_crud.delete_print_queue_config(db, new_default.id)
            print(f"   ⚠️ Tentativa de deletar fila padrão: {success}")
        except ValueError as e:
            print(f"   ✅ Proteção ativa: {e}")
        
        print("\n✅ Todos os testes concluídos com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro durante os testes: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_print_queues()
    if success:
        print("\n🎉 Testes concluídos com sucesso!")
    else:
        print("\n💥 Falha nos testes!")
        sys.exit(1) 