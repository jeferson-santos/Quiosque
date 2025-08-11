"""
Modelo de mesa.

Este módulo contém o modelo SQLAlchemy para mesas do sistema.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class Table(Base):
    """Modelo de mesa com relacionamento para pedidos."""

    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    is_closed = Column(Boolean, default=False)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String, nullable=True)
    room_id = Column(
        Integer, ForeignKey("rooms.id"), nullable=True
    )  # Associação opcional a quarto

    # Relacionamento reverso
    orders = relationship("Order", back_populates="table")
    print_queue_items = relationship("PrintQueue", back_populates="table")
    # Relacionamento com Room
    room = relationship("Room", backref="tables")
