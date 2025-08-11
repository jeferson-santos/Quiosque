"""
Modelos de usuário.

Este módulo contém os modelos SQLAlchemy para usuários e suas funções.
"""

from enum import Enum

from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class RoleEnum(str, Enum):
    """Enumeração dos papéis possíveis de um usuário."""

    WAITER = "waiter"
    ADMINISTRATOR = "administrator"
    AGENT = "agent"


class User(Base):
    """Modelo de usuário com autenticação e autorização."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
