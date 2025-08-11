"""
Modelos de cliente.

Este módulo contém os modelos SQLAlchemy para clientes e suas funções.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class ClientRoleEnum(str, Enum):
    """Enumeração dos papéis possíveis de um cliente."""

    WAITER = "waiter"
    ADMINISTRATOR = "administrator"


class Client(Base):
    """Modelo de cliente com autenticação via client_id e client_secret."""

    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, unique=True, index=True, nullable=False)
    client_secret = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default=ClientRoleEnum.WAITER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
