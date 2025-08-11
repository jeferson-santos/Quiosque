#!/usr/bin/env python3
"""
Script para testar a associação de categorias com filas de impressão.

Este script testa a funcionalidade de vincular categorias a filas de impressão.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.crud import print_queue_config as print_queue_config_crud
from app.crud import category as category_crud
from app.schemas.print_queue_config import PrintQueueConfigCreate
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.db import SessionLocal


def test_category_print_queues():
    """Testa a associação de categorias com filas de impressão."""
    db = SessionLocal()
    try:
        print("🧪 Testando associação de categorias com filas de impressão...")
        
        # 1. Garantir que existe uma fila padrão
        print("\n1️⃣ Garantindo fila padrão...")
        default_queue = print_queue_config_crud.ensure_default_queue_exists(db)
        print(f"   ✅ Fila padrão: {default_queue.name} (ID: {default_queue.id})")
        
        # 2. Criar uma fila específica para teste
        print("\n2️⃣ Criando fila específica...")
        specific_queue_data = PrintQueueConfigCreate(
            name="Fila Cozinha",
            description="Fila para impressão de pedidos da cozinha",
            printer_name="Kitchen-Printer-01",
            is_default=False
        )
        specific_queue = print_queue_config_crud.create_print_queue_config(db, specific_queue_data)
        print(f"   ✅ Fila específica criada: {specific_queue.name} (ID: {specific_queue.id})")
        
        # 3. Criar categorias para teste
        print("\n3️⃣ Criando categorias de teste...")
        
        # Categoria sem fila específica (usará a padrão)
        category_without_queue = CategoryCreate(
            name="Bebidas",
            description="Bebidas e refrigerantes",
            print_queue_id=None  # Usará a fila padrão
        )
        cat_without = category_crud.create_category(db, category_without_queue)
        print(f"   ✅ Categoria sem fila específica: {cat_without.name} (ID: {cat_without.id})")
        
        # Categoria com fila específica
        category_with_queue = CategoryCreate(
            name="Pratos Principais",
            description="Pratos principais da cozinha",
            print_queue_id=specific_queue.id
        )
        cat_with = category_crud.create_category(db, category_with_queue)
        print(f"   ✅ Categoria com fila específica: {cat_with.name} (ID: {cat_with.id})")
        
        # 4. Verificar as categorias criadas
        print("\n4️⃣ Verificando categorias criadas...")
        
        # Buscar categoria sem fila específica
        cat_without_loaded = category_crud.get_category_with_print_queue(db, cat_without.id)
        print(f"   📋 {cat_without_loaded.name}:")
        if cat_without_loaded.print_queue_config:
            print(f"      - Fila: {cat_without_loaded.print_queue_config.name}")
        else:
            print(f"      - Fila: Usará fila padrão ({default_queue.name})")
        
        # Buscar categoria com fila específica
        cat_with_loaded = category_crud.get_category_with_print_queue(db, cat_with.id)
        print(f"   📋 {cat_with_loaded.name}:")
        if cat_with_loaded.print_queue_config:
            print(f"      - Fila: {cat_with_loaded.print_queue_config.name}")
        else:
            print(f"      - Fila: Usará fila padrão ({default_queue.name})")
        
        # 5. Atualizar categoria para usar fila específica
        print("\n5️⃣ Atualizando categoria para usar fila específica...")
        update_data = CategoryUpdate(print_queue_id=specific_queue.id)
        updated_cat = category_crud.update_category(db, cat_without_loaded, update_data)
        print(f"   ✅ Categoria atualizada: {updated_cat.name}")
        
        # Verificar se a atualização funcionou
        updated_cat_loaded = category_crud.get_category_with_print_queue(db, updated_cat.id)
        print(f"   📋 {updated_cat_loaded.name}:")
        if updated_cat_loaded.print_queue_config:
            print(f"      - Fila: {updated_cat_loaded.print_queue_config.name}")
        else:
            print(f"      - Fila: Usará fila padrão ({default_queue.name})")
        
        # 6. Remover fila específica de uma categoria
        print("\n6️⃣ Removendo fila específica de categoria...")
        remove_queue_data = CategoryUpdate(print_queue_id=None)
        removed_cat = category_crud.update_category(db, updated_cat_loaded, remove_queue_data)
        print(f"   ✅ Fila específica removida de: {removed_cat.name}")
        
        # Verificar se voltou a usar a padrão
        removed_cat_loaded = category_crud.get_category_with_print_queue(db, removed_cat.id)
        print(f"   📋 {removed_cat_loaded.name}:")
        if removed_cat_loaded.print_queue_config:
            print(f"      - Fila: {removed_cat_loaded.print_queue_config.name}")
        else:
            print(f"      - Fila: Usará fila padrão ({default_queue.name})")
        
        # 7. Listar todas as categorias com suas filas
        print("\n7️⃣ Listando todas as categorias com suas filas...")
        all_categories = category_crud.get_all_categories(db)
        for cat in all_categories:
            if cat.print_queue_config:
                print(f"   📋 {cat.name}: {cat.print_queue_config.name}")
            else:
                print(f"   📋 {cat.name}: Fila padrão ({default_queue.name})")
        
        print("\n✅ Todos os testes de associação concluídos com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro durante os testes: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_category_print_queues()
    if success:
        print("\n🎉 Testes de associação concluídos com sucesso!")
    else:
        print("\n💥 Falha nos testes de associação!")
        sys.exit(1) 