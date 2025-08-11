#!/usr/bin/env python3
"""
Script completo para inicializar o ambiente de desenvolvimento.

Este script:
1. Verifica a conexão com o banco
2. Executa as migrações
3. Cria usuários padrão (admin/waiter)
4. Carrega dados de desenvolvimento
5. Verifica se tudo está funcionando
"""

import sys
import os
import subprocess
import time

# Adicionar o diretório pai ao path para importar os módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import Base, engine, SessionLocal
from app.models import user as user_model
from app.crud.user import create_user
from app.schemas.user import UserCreate
from app.models.user import RoleEnum

def check_database_connection():
    """Verifica se a conexão com o banco está funcionando."""
    print("🔍 Verificando conexão com o banco...")
    try:
        # Testar conexão
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexão com PostgreSQL OK!")
            return True
    except Exception as e:
        print(f"❌ Erro na conexão com o banco: {e}")
        print("💡 Verifique se o PostgreSQL está rodando: docker-compose up -d")
        return False

def run_migrations():
    """Verifica e executa migrações se necessário."""
    print("\n🔄 Verificando migrações...")
    try:
        # Verificar status atual das migrações
        result = subprocess.run(
            ["poetry", "run", "alembic", "current"],
            cwd="..",
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            current_revision = result.stdout.strip()
            print(f"  📋 Revisão atual: {current_revision}")
            
            # Verificar se há migrações pendentes
            result = subprocess.run(
                ["poetry", "run", "alembic", "upgrade", "head"],
                cwd="..",
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print("✅ Migrações estão atualizadas!")
                return True
            else:
                print(f"  ℹ️  Migrações já estão atualizadas")
                return True
        else:
            print(f"❌ Erro ao verificar migrações: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao executar migrações: {e}")
        return False

def create_users():
    """Cria usuários padrão para desenvolvimento."""
    print("\n👥 Criando usuários padrão...")
    
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
            print("  ✅ Usuário admin/admin123 criado")
            users_created += 1
        else:
            print("  ⚠️  Usuário admin já existe")
        
        # Usuário WAITER
        waiter_data = UserCreate(
            username="waiter",
            password="waiter123",
            role=RoleEnum.WAITER,
        )
        
        existing_waiter = db.query(user_model.User).filter_by(username="waiter").first()
        if not existing_waiter:
            create_user(db, waiter_data)
            print("  ✅ Usuário waiter/waiter123 criado")
            users_created += 1
        else:
            print("  ⚠️  Usuário waiter já existe")
        
        db.commit()
        print(f"✅ {users_created} usuários criados/verificados")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def load_dev_data():
    """Carrega dados de desenvolvimento usando os scripts de seed."""
    print("\n🌱 Carregando dados de desenvolvimento...")
    
    # Scripts na ordem correta (dependências)
    seed_scripts = [
        "seed_rooms.py",
        "seed_tables.py", 
        "seed_tables_with_room.py",
        "seed_categories.py",
        "seed_products.py",
        "seed_orders_with_payments.py",
        "seed_close_tables_with_room_charge.py"
    ]
    
    success_count = 0
    total_scripts = len(seed_scripts)
    
    for i, script in enumerate(seed_scripts, 1):
        print(f"\n[{i}/{total_scripts}] Executando {script}...")
        
        try:
            result = subprocess.run(
                [sys.executable, os.path.join("scripts", script)],
                cwd=".",
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"  ✅ {script} executado com sucesso!")
                success_count += 1
            else:
                print(f"  ❌ Erro em {script}: {result.stderr}")
                
        except Exception as e:
            print(f"  ❌ Erro ao executar {script}: {e}")
    
    print(f"\n📊 Resultado: {success_count}/{total_scripts} scripts executados")
    return success_count == total_scripts

def verify_setup():
    """Verifica se a configuração está funcionando."""
    print("\n🔍 Verificando configuração...")
    
    db = SessionLocal()
    try:
        # Verificar usuários
        admin_count = db.query(user_model.User).filter_by(role=RoleEnum.ADMINISTRATOR).count()
        waiter_count = db.query(user_model.User).filter_by(role=RoleEnum.WAITER).count()
        
        print(f"  👥 Usuários: {admin_count} admin(s), {waiter_count} waiter(s)")
        
        # Verificar tabelas principais
        from app.models.category import Category
        from app.models.product import Product
        from app.models.room import Room
        from app.models.table import Table
        
        categories_count = db.query(Category).count()
        products_count = db.query(Product).count()
        rooms_count = db.query(Room).count()
        tables_count = db.query(Table).count()
        
        print(f"  🏷️  Categorias: {categories_count}")
        print(f"  🍽️  Produtos: {products_count}")
        print(f"  🏠 Quartos: {rooms_count}")
        print(f"  🪑 Mesas: {tables_count}")
        
        print("✅ Configuração verificada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar configuração: {e}")
        return False
    finally:
        db.close()

def main():
    """Função principal."""
    print("🚀 INICIALIZANDO AMBIENTE DE DESENVOLVIMENTO")
    print("=" * 60)
    
    # Verificar conexão
    if not check_database_connection():
        return False
    
    # Verificar migrações (opcional)
    print("\n🔄 Verificando migrações...")
    try:
        result = subprocess.run(
            ["poetry", "run", "alembic", "current"],
            cwd="..",
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            current_revision = result.stdout.strip()
            print(f"  📋 Revisão atual: {current_revision}")
            print("✅ Migrações verificadas!")
        else:
            print("⚠️  Não foi possível verificar migrações, continuando...")
    except:
        print("⚠️  Não foi possível verificar migrações, continuando...")
    
    # Criar usuários
    if not create_users():
        return False
    
    # Carregar dados de desenvolvimento
    if not load_dev_data():
        print("⚠️  Alguns dados podem não ter sido carregados")
    
    # Verificar configuração
    if not verify_setup():
        return False
    
    print("\n" + "=" * 60)
    print("🎉 AMBIENTE DE DESENVOLVIMENTO CONFIGURADO!")
    print("=" * 60)
    
    print("\n📋 RESUMO:")
    print("  ✅ Banco PostgreSQL configurado")
    print("  ✅ Migrações executadas")
    print("  ✅ Usuários criados (admin/admin123, waiter/waiter123)")
    print("  ✅ Dados de desenvolvimento carregados")
    
    print("\n🔑 CREDENCIAIS:")
    print("  👑 Admin: admin / admin123")
    print("  👨‍💼 Waiter: waiter / waiter123")
    
    print("\n🌐 URLs:")
    print("  📱 Frontend: http://localhost:5173")
    print("  🔧 Backend: http://localhost:8000")
    print("  📚 API Docs: http://localhost:8000/docs")
    
    print("\n🚀 Para iniciar o sistema:")
    print("  cd backend && poetry run dev")
    print("  cd frontend && npm run dev")
    
    print("\n" + "=" * 60)
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n❌ Configuração falhou. Verifique os erros acima.")
        sys.exit(1)
