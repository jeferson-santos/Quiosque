#!/usr/bin/env python3
"""
Script para criar usuário agent de teste.

Este script cria um usuário com perfil "agent" para testar as funcionalidades.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.crud import user as user_crud
from app.schemas.user import UserCreate
from app.core.security import hash_password
from app.db import SessionLocal


def create_agent_user():
    """Cria um usuário agent de teste."""
    db = SessionLocal()
    try:
        print("👤 Criando usuário agent de teste...")
        
        # Verificar se o usuário já existe
        existing_user = user_crud.get_user_by_username(db, "agent")
        if existing_user:
            print("✅ Usuário agent já existe")
            return True
        
        # Criar usuário agent
        agent_data = UserCreate(
            username="agent",
            password="agent123",
            role="agent"
        )
        
        agent_user = user_crud.create_user(db, agent_data)
        print(f"✅ Usuário agent criado: {agent_user.username} (ID: {agent_user.id})")
        
        # Verificar se foi criado corretamente
        created_user = user_crud.get_user_by_username(db, "agent")
        if created_user and created_user.role == "agent":
            print("✅ Verificação: usuário agent criado corretamente")
        else:
            print("❌ Erro: usuário agent não foi criado corretamente")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário agent: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = create_agent_user()
    if success:
        print("\n🎉 Usuário agent criado com sucesso!")
        print("📋 Credenciais:")
        print("   Username: agent")
        print("   Password: agent123")
        print("   Role: agent")
    else:
        print("\n💥 Falha ao criar usuário agent!")
        sys.exit(1) 