"""
Modelos de pedidos.

Este módulo contém os modelos SQLAlchemy para pedidos e seus status.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db import Base


class OrderStatus(str, Enum):
    """Enumeração dos status possíveis de um pedido."""

    pending = "pending"
    cancelled = "cancelled"
    finished = "finished"


class Order(Base):
    """Modelo de pedido com relacionamento para itens."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    comment = Column(String, nullable=True)  # Comentário geral do pedido
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    updated_by = Column(String, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(String, nullable=True)

    # Relacionamentos
    table = relationship("Table", back_populates="orders")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    payment = relationship(
        "Payment", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )
    print_queue_items = relationship("PrintQueue", back_populates="order")

    @property
    def total_amount(self):
        """Calcula o valor total do pedido."""
        return sum(item.unit_price * item.quantity for item in self.items)

    @property
    def total_items(self):
        """Calcula o total de itens no pedido."""
        return sum(item.quantity for item in self.items)
