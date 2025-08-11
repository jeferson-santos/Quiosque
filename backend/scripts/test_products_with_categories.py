#!/usr/bin/env python3
"""
Script para testar se os produtos estão retornando com categorias.

Este script testa se as mudanças na API estão funcionando corretamente.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.product import get_all_products, get_product_with_category


def test_products_with_categories():
    """Testa se os produtos estão retornando com categorias."""
    db = SessionLocal()
    
    try:
        print("=== Testando Produtos com Categorias ===\n")
        
        # 1. Testar listagem de produtos
        print("1. Testando listagem de produtos...")
        all_products = get_all_products(db)
        print(f"   Total de produtos: {len(all_products)}")
        
        # Verificar se os produtos têm categoria
        products_with_category = [p for p in all_products if hasattr(p, 'category_rel') and p.category_rel]
        print(f"   Produtos com categoria: {len(products_with_category)}")
        
        if products_with_category:
            sample_product = products_with_category[0]
            print(f"   ✅ Exemplo: '{sample_product.name}' na categoria '{sample_product.category_rel.name}'")
        else:
            print("   ⚠️  Nenhum produto com categoria encontrado")
        
        # 2. Testar busca de produto específico
        print("\n2. Testando busca de produto específico...")
        if all_products:
            test_product = all_products[0]
            product_with_category = get_product_with_category(db, test_product.id)
            
            if product_with_category and hasattr(product_with_category, 'category_rel') and product_with_category.category_rel:
                print(f"   ✅ Produto '{product_with_category.name}' encontrado com categoria '{product_with_category.category_rel.name}'")
            else:
                print(f"   ❌ Produto '{test_product.name}' não tem categoria associada")
        
        # 3. Testar filtro por categoria
        print("\n3. Testando filtro por categoria...")
        from app.crud.category import get_all_categories
        categories = get_all_categories(db)
        
        if categories:
            test_category = categories[0]
            products_in_category = get_all_products(db, category_id=test_category.id)
            print(f"   📁 Categoria '{test_category.name}': {len(products_in_category)} produtos")
            
            for product in products_in_category[:3]:  # Mostrar apenas os 3 primeiros
                if hasattr(product, 'category_rel') and product.category_rel:
                    print(f"     - {product.name} (categoria: {product.category_rel.name})")
                else:
                    print(f"     - {product.name} (sem categoria)")
        else:
            print("   ⚠️  Nenhuma categoria encontrada")
        
        # 4. Verificar estrutura dos dados
        print("\n4. Verificando estrutura dos dados...")
        if all_products:
            sample = all_products[0]
            print(f"   📋 Estrutura do produto '{sample.name}':")
            print(f"     - ID: {sample.id}")
            print(f"     - Nome: {sample.name}")
            print(f"     - Preço: R$ {sample.price:.2f}")
            print(f"     - Categoria ID: {sample.category_id}")
            
            if hasattr(sample, 'category_rel') and sample.category_rel:
                print(f"     - Categoria: {sample.category_rel.name}")
                print(f"     - Descrição da categoria: {sample.category_rel.description}")
            else:
                print("     - Categoria: Não carregada")
        
        print("\n=== Teste concluído! ===")
        
        # 5. Resumo
        print("\n📋 RESUMO:")
        print(f"   📦 Total de produtos: {len(all_products)}")
        print(f"   ✅ Produtos com categoria: {len(products_with_category)}")
        print(f"   ⚠️  Produtos sem categoria: {len(all_products) - len(products_with_category)}")
        
        if len(products_with_category) == len(all_products):
            print("   🎉 Todos os produtos têm categoria associada!")
        else:
            print("   ⚠️  Alguns produtos não têm categoria associada")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_products_with_categories() 