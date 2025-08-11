"""
Configuração do banco de dados.

Este módulo contém a configuração do SQLAlchemy para conexão
com o banco de dados PostgreSQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import Settings

settings = Settings()
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL  # pega do .env

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=(
        {"check_same_thread": False}
        if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
        else {}
    ),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
