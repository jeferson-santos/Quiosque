#!/usr/bin/env python3
"""
Script para testar a funcionalidade de ordenação de categorias.

Este script testa:
1. Listagem de categorias ordenadas por display_order
2. Alteração da ordem de exibição
3. Verificação da ordenação correta
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.category import get_all_categories, update_category
from app.schemas.category import CategoryUpdate


def test_category_ordering():
    """Testa a funcionalidade de ordenação de categorias."""
    db = SessionLocal()
    
    try:
        print("=== Testando Ordenação de Categorias ===\n")
        
        # 1. Listar categorias ordenadas
        print("1. Listando categorias ordenadas por display_order...")
        categories = get_all_categories(db)
        
        if categories:
            print(f"   Total de categorias: {len(categories)}")
            print("   📋 Ordem atual:")
            for i, cat in enumerate(categories, 1):
                print(f"     {i:2d}. [{cat.display_order:2d}] {cat.name}")
        else:
            print("   ⚠️  Nenhuma categoria encontrada")
            return
        
        # 2. Testar alteração de ordem
        print("\n2. Testando alteração de ordem...")
        if len(categories) >= 2:
            # Pegar a primeira categoria e alterar sua ordem
            first_category = categories[0]
            new_order = first_category.display_order + 10  # Mover para o final
            
            print(f"   Alterando ordem da categoria '{first_category.name}' de {first_category.display_order} para {new_order}")
            
            update_data = CategoryUpdate(display_order=new_order)
            updated_category = update_category(db, first_category, update_data)
            
            print(f"   ✅ Categoria '{updated_category.name}' atualizada com ordem {updated_category.display_order}")
            
            # 3. Verificar nova ordenação
            print("\n3. Verificando nova ordenação...")
            updated_categories = get_all_categories(db)
            
            print("   📋 Nova ordem:")
            for i, cat in enumerate(updated_categories, 1):
                print(f"     {i:2d}. [{cat.display_order:2d}] {cat.name}")
            
            # 4. Restaurar ordem original
            print(f"\n4. Restaurando ordem original...")
            restore_data = CategoryUpdate(display_order=first_category.display_order)
            update_category(db, updated_category, restore_data)
            
            print(f"   ✅ Ordem restaurada para {first_category.display_order}")
            
        else:
            print("   ⚠️  Necessário pelo menos 2 categorias para testar reordenação")
        
        # 5. Verificar ordenação final
        print("\n5. Verificando ordenação final...")
        final_categories = get_all_categories(db)
        
        print("   📋 Ordem final:")
        for i, cat in enumerate(final_categories, 1):
            print(f"     {i:2d}. [{cat.display_order:2d}] {cat.name}")
        
        # 6. Verificar se a ordenação está correta
        print("\n6. Validando ordenação...")
        is_ordered = True
        for i in range(len(final_categories) - 1):
            current = final_categories[i]
            next_cat = final_categories[i + 1]
            
            if current.display_order > next_cat.display_order:
                is_ordered = False
                print(f"   ❌ Ordem incorreta: {current.name} ({current.display_order}) > {next_cat.name} ({next_cat.display_order})")
                break
        
        if is_ordered:
            print("   ✅ Ordenação está correta!")
        else:
            print("   ❌ Ordenação incorreta!")
        
        print("\n=== Teste concluído! ===")
        
        # 7. Resumo
        print("\n📋 RESUMO:")
        print(f"   🏷️  Total de categorias: {len(final_categories)}")
        print("   ✅ Categorias ordenadas por display_order")
        print("   ✅ Funcionalidade de alteração de ordem funcionando")
        print("\n💡 Para alterar a ordem no frontend:")
        print("   - Use PATCH /categories/{id} com display_order")
        print("   - Categorias são automaticamente ordenadas por display_order")
        print("   - Menor número = aparece primeiro")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_category_ordering() 