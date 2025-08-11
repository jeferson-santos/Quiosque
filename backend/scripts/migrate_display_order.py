#!/usr/bin/env python3
"""
Script de migração para adicionar display_order nas categorias.

Este script:
1. Adiciona a coluna display_order à tabela categories
2. Define valores padrão para categorias existentes
3. Atualiza as categorias com ordem de exibição
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import SessionLocal, engine
from app.models.category import Category


def add_display_order_column():
    """Adiciona a coluna display_order à tabela categories se não existir."""
    with engine.connect() as conn:
        # Verificar se a coluna display_order já existe
        result = conn.execute(text("PRAGMA table_info(categories)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'display_order' not in columns:
            print("Adicionando coluna display_order à tabela categories...")
            conn.execute(text("ALTER TABLE categories ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0"))
            conn.commit()
            print("Coluna display_order adicionada com sucesso!")
        else:
            print("Coluna display_order já existe na tabela categories.")


def update_existing_categories():
    """Atualiza categorias existentes com ordem de exibição."""
    db = SessionLocal()
    try:
        # Buscar todas as categorias
        categories = db.query(Category).all()
        
        if not categories:
            print("Nenhuma categoria encontrada para atualizar.")
            return
        
        # Definir ordem padrão baseada no nome
        default_order = {
            "Bebidas": 1,
            "Petiscos": 2,
            "Frutos do Mar": 3,
            "Crepes": 4,
            "Sobremesas": 5,
            "Outros": 6
        }
        
        updated_count = 0
        for category in categories:
            # Se a categoria não tem display_order ou é 0, definir baseado no nome
            if not hasattr(category, 'display_order') or category.display_order == 0:
                order = default_order.get(category.name, 999)  # 999 para categorias não padrão
                category.display_order = order
                updated_count += 1
                print(f"  ✅ Categoria '{category.name}' definida com ordem {order}")
        
        if updated_count > 0:
            db.commit()
            print(f"\n🎉 {updated_count} categorias atualizadas com ordem de exibição!")
        else:
            print("Todas as categorias já têm ordem de exibição definida.")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao atualizar categorias: {e}")
    finally:
        db.close()


def list_categories_with_order():
    """Lista categorias com sua ordem de exibição."""
    db = SessionLocal()
    try:
        categories = db.query(Category).order_by(Category.display_order, Category.name).all()
        
        print("\n📋 Categorias ordenadas por display_order:")
        for cat in categories:
            print(f"  {cat.display_order:2d}. {cat.name} - {cat.description}")
            
    except Exception as e:
        print(f"❌ Erro ao listar categorias: {e}")
    finally:
        db.close()


def main():
    """Executa a migração completa."""
    print("Iniciando migração de display_order...")
    
    try:
        # 1. Adicionar coluna display_order
        add_display_order_column()
        
        # 2. Atualizar categorias existentes
        update_existing_categories()
        
        # 3. Listar categorias com ordem
        list_categories_with_order()
        
        print("\n✅ Migração de display_order concluída com sucesso!")
        print("\n💡 Agora as categorias serão retornadas ordenadas por display_order")
        print("💡 Use PATCH /categories/{id} para alterar a ordem de exibição")
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 