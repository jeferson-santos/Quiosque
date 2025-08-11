"""
Modelo de status do sistema.

Este módulo contém o modelo SQLAlchemy para controlar o status do sistema.
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.db import Base


class SystemStatus(Base):
    """Modelo de status do sistema para controle de pedidos."""

    __tablename__ = "system_status"

    id = Column(Integer, primary_key=True, index=True)
    orders_enabled = Column(Boolean, default=True, nullable=False)
    reason = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) 