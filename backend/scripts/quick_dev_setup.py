#!/usr/bin/env python3
"""
Script simplificado para inicialização rápida do ambiente de desenvolvimento.

Este script:
1. Verifica a conexão com o banco
2. Cria usuários padrão (admin/waiter)
3. Carrega dados básicos de desenvolvimento
4. Verifica se tudo está funcionando
"""

import sys
import os

# Adicionar o diretório pai ao path para importar os módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import Base, engine, SessionLocal
from app.models import user as user_model
from app.crud.user import create_user
from app.schemas.user import UserCreate
from app.models.user import RoleEnum

def check_database_connection():
    """Verifica se a conexão com o banco está funcionando."""
    print("Verificando conexao com o banco...")
    try:
        # Testar conexão
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1"))
            print("Conexao com PostgreSQL OK!")
            return True
    except Exception as e:
        print(f"Erro na conexao com o banco: {e}")
        print("Verifique se o PostgreSQL esta rodando: docker-compose up -d")
        return False

def create_users():
    """Cria usuários padrão para desenvolvimento."""
    print("Criando usuarios padrao...")
    
    db = SessionLocal()
    users_created = 0
    
    try:
        # Usuário ADMIN
        admin_data = UserCreate(
            username="admin",
            password="admin123",
            role=RoleEnum.ADMINISTRATOR,
        )
        
        existing_admin = db.query(user_model.User).filter_by(username="admin").first()
        if not existing_admin:
            create_user(db, admin_data)
            print("  Usuario admin/admin123 criado")
            users_created += 1
        else:
            print("  Usuario admin ja existe")
        
        # Usuário WAITER
        waiter_data = UserCreate(
            username="waiter",
            password="waiter123",
            role=RoleEnum.WAITER,
        )
        
        existing_waiter = db.query(user_model.User).filter_by(username="waiter").first()
        if not existing_waiter:
            create_user(db, waiter_data)
            print("  Usuario waiter/waiter123 criado")
            users_created += 1
        else:
            print("  Usuario waiter ja existe")
        
        db.commit()
        print(f"{users_created} usuarios criados/verificados")
        return True
        
    except Exception as e:
        print(f"Erro ao criar usuarios: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def load_basic_data():
    """Carrega dados básicos de desenvolvimento."""
    print("Carregando dados basicos...")
    
    db = SessionLocal()
    try:
        # Criar categorias básicas
        from app.models.category import Category
        from app.schemas.category import CategoryCreate
        from app.crud.category import create_category, get_category_by_name
        
        categorias = [
            {"name": "Bebidas", "description": "Refrigerantes, sucos, agua, cervejas", "is_active": True, "display_order": 1},
            {"name": "Petiscos", "description": "Petiscos, aperitivos e entradas", "is_active": True, "display_order": 2},
            {"name": "Frutos do Mar", "description": "Camarao, lula, peixe e outros", "is_active": True, "display_order": 3},
            {"name": "Crepes", "description": "Crepes doces e salgados", "is_active": True, "display_order": 4},
            {"name": "Sobremesas", "description": "Sorvetes, doces e sobremesas", "is_active": True, "display_order": 5},
        ]
        
        for cat_data in categorias:
            existing = get_category_by_name(db, cat_data["name"])
            if not existing:
                category_data = CategoryCreate(**cat_data)
                create_category(db, category_data)
                print(f"  Categoria '{cat_data['name']}' criada")
        
        # Criar alguns produtos básicos
        from app.models.product import Product
        from app.schemas.product import ProductCreate
        from app.crud.product import create_product
        
        produtos = [
            {"name": "Coca-Cola", "price": 8.50, "category_id": 1, "is_active": True},
            {"name": "Agua", "price": 5.00, "category_id": 1, "is_active": True},
            {"name": "Batata Frita", "price": 15.00, "category_id": 2, "is_active": True},
            {"name": "Crepe de Chocolate", "price": 18.00, "category_id": 4, "is_active": True},
        ]
        
        for prod_data in produtos:
            product_data = ProductCreate(**prod_data)
            create_product(db, product_data)
            print(f"  Produto '{prod_data['name']}' criado")
        
        db.commit()
        print("Dados basicos carregados com sucesso!")
        return True
        
    except Exception as e:
        print(f"Erro ao carregar dados: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_setup():
    """Verifica se a configuração está funcionando."""
    print("Verificando configuracao...")
    
    db = SessionLocal()
    try:
        # Verificar usuários
        admin_count = db.query(user_model.User).filter_by(role=RoleEnum.ADMINISTRATOR).count()
        waiter_count = db.query(user_model.User).filter_by(role=RoleEnum.WAITER).count()
        
        print(f"  Usuarios: {admin_count} admin(s), {waiter_count} waiter(s)")
        
        # Verificar tabelas principais
        from app.models.category import Category
        from app.models.product import Product
        
        categories_count = db.query(Category).count()
        products_count = db.query(Product).count()
        
        print(f"  Categorias: {categories_count}")
        print(f"  Produtos: {products_count}")
        
        print("Configuracao verificada com sucesso!")
        return True
        
    except Exception as e:
        print(f"Erro ao verificar configuracao: {e}")
        return False
    finally:
        db.close()

def main():
    """Função principal."""
    print("INICIALIZANDO AMBIENTE DE DESENVOLVIMENTO")
    print("=" * 60)
    
    # Verificar conexão
    if not check_database_connection():
        return False
    
    # Criar usuários
    if not create_users():
        return False
    
    # Carregar dados básicos
    if not load_basic_data():
        return False
    
    # Verificar configuração
    if not verify_setup():
        return False
    
    print("\n" + "=" * 60)
    print("AMBIENTE DE DESENVOLVIMENTO CONFIGURADO!")
    print("=" * 60)
    
    print("\nRESUMO:")
    print("  Banco PostgreSQL configurado")
    print("  Usuarios criados (admin/admin123, waiter/waiter123)")
    print("  Dados basicos carregados")
    
    print("\nCREDENCIAIS:")
    print("  Admin: admin / admin123")
    print("  Waiter: waiter / waiter123")
    
    print("\nURLs:")
    print("  Frontend: http://localhost:5173")
    print("  Backend: http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")
    
    print("\nPara iniciar o sistema:")
    print("  cd backend && poetry run dev")
    print("  cd frontend && npm run dev")
    
    print("\n" + "=" * 60)
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\nConfiguracao falhou. Verifique os erros acima.")
        sys.exit(1)
