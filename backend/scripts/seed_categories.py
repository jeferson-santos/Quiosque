#!/usr/bin/env python3
"""
Script para criar categorias padrão no sistema.

Este script cria as categorias básicas necessárias para organizar os produtos.
"""

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.schemas.category import CategoryCreate
from app.crud.category import create_category, get_category_by_name

# Lista de categorias padrão
categorias = [
    {
        "name": "Bebidas",
        "description": "Refrigerantes, sucos, água, cervejas e outras bebidas",
        "is_active": True,
        "display_order": 1
    },
    {
        "name": "Petiscos",
        "description": "Petiscos, aperitivos e entradas",
        "is_active": True,
        "display_order": 2
    },
    {
        "name": "Frutos do Mar",
        "description": "Camarão, lula, peixe e outros frutos do mar",
        "is_active": True,
        "display_order": 3
    },
    {
        "name": "Crepes",
        "description": "Crepes doces e salgados",
        "is_active": True,
        "display_order": 4
    },
    {
        "name": "Sobremesas",
        "description": "Sorvetes, doces e sobremesas",
        "is_active": True,
        "display_order": 5
    },
    {
        "name": "Outros",
        "description": "Outros produtos diversos",
        "is_active": True,
        "display_order": 6
    }
]

def main():
    """Função principal para criar categorias."""
    db = SessionLocal()
    created_count = 0
    
    try:
        print("🌱 Criando categorias padrão...")
        
        for cat_data in categorias:
            # Verificar se a categoria já existe
            existing = get_category_by_name(db, cat_data["name"])
            if existing:
                print(f"  ⚠️  Categoria '{cat_data['name']}' já existe (ID: {existing.id})")
                continue
            
            # Criar categoria
            category_data = CategoryCreate(**cat_data)
            category = create_category(db, category_data)
            created_count += 1
            print(f"  ✅ Categoria '{category.name}' criada com ID {category.id}")
        
        print(f"\n🎉 {created_count} categorias criadas com sucesso!")
        print(f"📋 Total de categorias no sistema: {len(categorias)}")
        
        # Listar todas as categorias
        print("\n📝 Categorias disponíveis:")
        from app.crud.category import get_all_categories
        all_categories = get_all_categories(db)
        for cat in all_categories:
            print(f"  - {cat.name}: {cat.description}")
            
    except Exception as e:
        print(f"❌ Erro ao criar categorias: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 