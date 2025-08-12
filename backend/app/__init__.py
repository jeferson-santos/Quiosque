"""
Módulo principal da aplicação de pedidos de quiosque.

Este módulo contém a aplicação FastAPI para gerenciamento de pedidos,
mesas, produtos e usuários de um sistema de quiosque.
"""

__version__ = "1.0.0"

import json
import platform
import sys

# app/__init__.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from sqlalchemy import text

from app.api import (
    auth,
    categories,
    payments,
    print_queue,
    print_queues,
    products,
    reports,
    rooms,
    system_status,
    tables,
    users,
)
from app.core.config import Settings
from app.db import Base, SessionLocal, engine
from app.middleware_logging import LoggingMiddleware
from app.crud.user import create_user, get_user_by_username
from app.schemas.user import UserCreate, RoleEnum

# Configurar Loguru para logs JSON
logger.remove()
logger.add(sys.stdout, serialize=True, backtrace=True, diagnose=True)

app = FastAPI()

app.title = "FastAPI Restaurant Management"
app.description = "A simple restaurant management system built with FastAPI."
app.version = "1.0.0"

# Configuração CORS
settings = Settings()

# Para desenvolvimento: liberar toda rede interna
if settings.DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permite todas as origens
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Para produção: usar configuração específica
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(LoggingMiddleware)

# Rotas
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(tables.router)
app.include_router(products.router)
app.include_router(reports.router)
app.include_router(rooms.router)
app.include_router(system_status.router)
app.include_router(print_queue.router)
app.include_router(print_queues.router)


@app.get("/health", tags=["Health"])
def healthcheck():
    db_status = "ok"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    return {
        "status": "ok",
        "db": db_status,
    }


@app.on_event("startup")
async def startup_event():
    """Evento executado quando a aplicação inicia."""
    try:
        logger.info("🚀 Iniciando configuração automática do banco de dados...")
        
        # Criar todas as tabelas automaticamente
        logger.info("🔧 Criando tabelas no banco de dados...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tabelas criadas com sucesso!")
        
        # Criar usuário admin padrão se não existir
        with SessionLocal() as db:
            admin_user = get_user_by_username(db, "admin")
            if not admin_user:
                logger.info("👤 Criando usuário admin padrão...")
                admin_data = UserCreate(
                    username="admin",
                    password="admin123",
                    role=RoleEnum.ADMINISTRATOR,
                )
                create_user(db, admin_data)
                logger.info("✅ Usuário admin criado com sucesso!")
                logger.info("📋 Credenciais padrão: admin / admin123")
            else:
                logger.info("✅ Usuário admin já existe")
                
        logger.info("🎉 Configuração automática concluída com sucesso!")
                
    except Exception as e:
        logger.error(f"❌ Erro durante configuração automática: {e}")
        # Não falhar a aplicação se não conseguir configurar
        logger.warning("⚠️ Aplicação continuará sem configuração automática")
