#!/usr/bin/env python3
"""
Script para testar a funcionalidade completa de categorias e produtos.

Este script testa:
1. Listagem de categorias
2. Listagem de produtos por categoria
3. Validações de relacionamento
4. Endpoints da API
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.category import get_all_categories, get_category_with_products
from app.crud.product import get_all_products, get_product_with_category


def test_categories_and_products():
    """Testa a funcionalidade completa de categorias e produtos."""
    db = SessionLocal()
    
    try:
        print("=== Testando Funcionalidade Completa de Categorias e Produtos ===\n")
        
        # 1. Listar todas as categorias
        print("1. Listando todas as categorias...")
        all_categories = get_all_categories(db)
        print(f"   Total de categorias: {len(all_categories)}")
        for cat in all_categories:
            print(f"   - {cat.name}: {cat.description} (ID: {cat.id})")
        
        # 2. Listar produtos por categoria
        print("\n2. Listando produtos por categoria...")
        for category in all_categories:
            products_in_category = get_all_products(db, category_id=category.id)
            print(f"   📁 Categoria '{category.name}': {len(products_in_category)} produtos")
            for product in products_in_category:
                print(f"     - {product.name}: R$ {product.price:.2f} (Estoque: {product.stock_quantity})")
        
        # 3. Testar relacionamento categoria-produto
        print("\n3. Testando relacionamentos categoria-produto...")
        for category in all_categories:
            category_with_products = get_category_with_products(db, category.id)
            if category_with_products:
                print(f"   ✅ Categoria '{category.name}' tem {len(category_with_products.products)} produtos")
            else:
                print(f"   ⚠️  Categoria '{category.name}' não encontrada")
        
        # 4. Estatísticas gerais
        print("\n4. Estatísticas gerais...")
        total_products = len(get_all_products(db))
        active_products = len(get_all_products(db, is_active=True))
        inactive_products = len(get_all_products(db, is_active=False))
        
        print(f"   📊 Total de produtos: {total_products}")
        print(f"   📊 Produtos ativos: {active_products}")
        print(f"   📊 Produtos inativos: {inactive_products}")
        
        # 5. Verificar produtos sem categoria (deve ser 0)
        print("\n5. Verificando produtos sem categoria...")
        products_without_category = [p for p in get_all_products(db) if not p.category_id]
        if products_without_category:
            print(f"   ⚠️  Encontrados {len(products_without_category)} produtos sem categoria:")
            for p in products_without_category:
                print(f"     - {p.name}")
        else:
            print("   ✅ Todos os produtos têm categoria associada")
        
        # 6. Testar busca de produto com categoria
        print("\n6. Testando busca de produto com categoria...")
        all_products = get_all_products(db)
        if all_products:
            test_product = all_products[0]
            product_with_category = get_product_with_category(db, test_product.id)
            if product_with_category:
                print(f"   ✅ Produto '{test_product.name}' encontrado com categoria")
            else:
                print(f"   ❌ Erro ao buscar produto '{test_product.name}' com categoria")
        
        print("\n=== Teste concluído com sucesso! ===")
        
        # 7. Resumo final
        print("\n📋 RESUMO FINAL:")
        print(f"   🏷️  Categorias criadas: {len(all_categories)}")
        print(f"   📦 Produtos criados: {total_products}")
        print(f"   ✅ Produtos com categoria: {total_products - len(products_without_category)}")
        print(f"   ⚠️  Produtos sem categoria: {len(products_without_category)}")
        
        # 8. Sugestões de teste da API
        print("\n🧪 SUGESTÕES PARA TESTE DA API:")
        print("   - GET /categories/ - Listar todas as categorias")
        print("   - GET /categories/1 - Buscar categoria específica")
        print("   - GET /categories/1/with-products - Categoria com produtos")
        print("   - GET /products/?category_id=1 - Produtos por categoria")
        print("   - GET /products/1 - Produto específico com categoria")
        print("   - POST /categories/ - Criar nova categoria")
        print("   - POST /products/ - Criar novo produto (com category_id)")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_categories_and_products() 