#!/usr/bin/env python3
"""
Script de migração para adicionar print_queue_id às categorias.

Este script adiciona a coluna print_queue_id à tabela categories.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db import SessionLocal, engine


def migrate_print_queue_id():
    """Adiciona a coluna print_queue_id à tabela categories."""
    db = SessionLocal()
    try:
        print("🔄 Iniciando migração para adicionar print_queue_id às categorias...")
        
        # Verificar se a coluna já existe (SQLite)
        result = db.execute(text("PRAGMA table_info(categories)"))
        columns = result.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'print_queue_id' in column_names:
            print("✅ Coluna print_queue_id já existe na tabela categories")
            return True
        
        # Adicionar a coluna print_queue_id
        print("📝 Adicionando coluna print_queue_id...")
        db.execute(text("""
            ALTER TABLE categories 
            ADD COLUMN print_queue_id INTEGER 
            REFERENCES print_queue_configs(id)
        """))
        
        db.commit()
        print("✅ Coluna print_queue_id adicionada com sucesso!")
        
        # Verificar se a coluna foi criada
        result = db.execute(text("PRAGMA table_info(categories)"))
        columns = result.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'print_queue_id' in column_names:
            print("✅ Verificação: coluna print_queue_id criada corretamente")
        else:
            print("❌ Erro: coluna print_queue_id não foi criada")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = migrate_print_queue_id()
    if success:
        print("\n🎉 Migração concluída com sucesso!")
    else:
        print("\n💥 Falha na migração!")
        sys.exit(1) 