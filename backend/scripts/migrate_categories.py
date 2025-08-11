#!/usr/bin/env python3
"""
Script de migração para adicionar categorias de produtos.

Este script:
1. Cria a tabela de categorias
2. Cria categorias padrão
3. Atualiza produtos existentes para usar categorias
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.models.category import Category
from app.models.product import Product


def create_categories_table():
    """Cria a tabela de categorias se não existir."""
    with engine.connect() as conn:
        # Verificar se a tabela categories já existe
        result = conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='categories'
        """))
        
        if not result.fetchone():
            print("Criando tabela de categorias...")
            conn.execute(text("""
                CREATE TABLE categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR NOT NULL UNIQUE,
                    description VARCHAR,
                    is_active BOOLEAN NOT NULL DEFAULT 1
                )
            """))
            conn.commit()
            print("Tabela de categorias criada com sucesso!")
        else:
            print("Tabela de categorias já existe.")


def add_category_column_to_products():
    """Adiciona a coluna category_id à tabela products se não existir."""
    with engine.connect() as conn:
        # Verificar se a coluna category_id já existe
        result = conn.execute(text("PRAGMA table_info(products)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'category_id' not in columns:
            print("Adicionando coluna category_id à tabela products...")
            conn.execute(text("ALTER TABLE products ADD COLUMN category_id INTEGER"))
            conn.commit()
            print("Coluna category_id adicionada com sucesso!")
        else:
            print("Coluna category_id já existe na tabela products.")


def create_default_categories():
    """Cria categorias padrão."""
    db = SessionLocal()
    try:
        default_categories = [
            {"name": "Bebidas", "description": "Refrigerantes, sucos, água e outras bebidas"},
            {"name": "Comidas", "description": "Pratos principais, lanches e refeições"},
            {"name": "Sobremesas", "description": "Doces, sorvetes e sobremesas"},
            {"name": "Aperitivos", "description": "Petiscos e entradas"},
            {"name": "Outros", "description": "Outros produtos diversos"}
        ]
        
        for cat_data in default_categories:
            existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                category = Category(**cat_data)
                db.add(category)
                print(f"Categoria '{cat_data['name']}' criada.")
        
        db.commit()
        print("Categorias padrão criadas com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar categorias padrão: {e}")
    finally:
        db.close()


def migrate_existing_products():
    """Migra produtos existentes para usar categorias."""
    db = SessionLocal()
    try:
        # Buscar categoria padrão (ou criar se não existir)
        default_category = db.query(Category).filter(Category.name == "Outros").first()
        if not default_category:
            default_category = Category(name="Outros", description="Outros produtos diversos")
            db.add(default_category)
            db.commit()
            db.refresh(default_category)
        
        # Atualizar produtos que não têm category_id
        products_without_category = db.query(Product).filter(Product.category_id.is_(None)).all()
        
        for product in products_without_category:
            product.category_id = default_category.id
            print(f"Produto '{product.name}' associado à categoria '{default_category.name}'")
        
        db.commit()
        print(f"{len(products_without_category)} produtos migrados com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao migrar produtos: {e}")
    finally:
        db.close()


def main():
    """Executa a migração completa."""
    print("Iniciando migração de categorias...")
    
    try:
        # 1. Criar tabela de categorias
        create_categories_table()
        
        # 2. Adicionar coluna category_id à tabela products
        add_category_column_to_products()
        
        # 3. Criar categorias padrão
        create_default_categories()
        
        # 4. Migrar produtos existentes
        migrate_existing_products()
        
        print("Migração concluída com sucesso!")
        
    except Exception as e:
        print(f"Erro durante a migração: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 