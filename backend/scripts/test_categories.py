#!/usr/bin/env python3
"""
Script para testar a funcionalidade de categorias de produtos.

Este script testa:
1. Criação de categorias
2. Criação de produtos com categorias
3. Busca de produtos por categoria
4. Validações de categoria
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.category import create_category, get_all_categories, get_category
from app.crud.product import create_product, get_all_products
from app.schemas.category import CategoryCreate
from app.schemas.product import ProductCreate


def test_categories():
    """Testa a funcionalidade de categorias."""
    db = SessionLocal()
    
    try:
        print("=== Testando Funcionalidade de Categorias ===\n")
        
        # 1. Criar categorias de teste
        print("1. Criando categorias de teste...")
        categories_data = [
            {"name": "Bebidas", "description": "Refrigerantes, sucos e água"},
            {"name": "Lanches", "description": "Sanduíches e salgados"},
            {"name": "Sobremesas", "description": "Doces e sorvetes"}
        ]
        
        created_categories = []
        for cat_data in categories_data:
            category_create = CategoryCreate(**cat_data)
            category = create_category(db, category_create)
            created_categories.append(category)
            print(f"   ✓ Categoria '{category.name}' criada com ID {category.id}")
        
        # 2. Listar todas as categorias
        print("\n2. Listando todas as categorias...")
        all_categories = get_all_categories(db)
        for cat in all_categories:
            print(f"   - {cat.name}: {cat.description} (Ativo: {cat.is_active})")
        
        # 3. Criar produtos com categorias
        print("\n3. Criando produtos com categorias...")
        products_data = [
            {
                "name": "Coca-Cola",
                "description": "Refrigerante Coca-Cola 350ml",
                "price": 5.50,
                "category_id": created_categories[0].id,  # Bebidas
                "stock_quantity": 50
            },
            {
                "name": "X-Burger",
                "description": "Hambúrguer com queijo e salada",
                "price": 15.90,
                "category_id": created_categories[1].id,  # Lanches
                "stock_quantity": 20
            },
            {
                "name": "Sorvete de Chocolate",
                "description": "Sorvete de chocolate 200ml",
                "price": 8.50,
                "category_id": created_categories[2].id,  # Sobremesas
                "stock_quantity": 30
            }
        ]
        
        created_products = []
        for prod_data in products_data:
            product_create = ProductCreate(**prod_data)
            product = create_product(db, product_create)
            created_products.append(product)
            print(f"   ✓ Produto '{product.name}' criado com categoria ID {product.category_id}")
        
        # 4. Buscar produtos por categoria
        print("\n4. Buscando produtos por categoria...")
        for category in created_categories:
            products_in_category = get_all_products(db, category_id=category.id)
            print(f"   Categoria '{category.name}': {len(products_in_category)} produtos")
            for product in products_in_category:
                print(f"     - {product.name}: R$ {product.price:.2f}")
        
        # 5. Testar validação de categoria inexistente
        print("\n5. Testando validação de categoria inexistente...")
        try:
            invalid_product = ProductCreate(
                name="Produto Teste",
                description="Produto com categoria inexistente",
                price=10.00,
                category_id=999  # ID inexistente
            )
            create_product(db, invalid_product)
            print("   ❌ Erro: Produto foi criado com categoria inexistente")
        except ValueError as e:
            print(f"   ✓ Validação funcionou: {e}")
        
        print("\n=== Teste concluído com sucesso! ===")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_categories() 