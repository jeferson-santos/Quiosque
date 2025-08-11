"""
Modelo de fila para impressão (PrintQueue).

Este módulo contém o modelo SQLAlchemy para a fila de impressão.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class PrintQueueStatus(str, Enum):
    """Enumeração dos status possíveis de um item na fila de impressão."""

    PENDING = "pending"
    PRINTED = "printed"
    ERROR = "error"


class PrintQueue(Base):
    """Modelo de item na fila de impressão."""

    __tablename__ = "print_queue"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # "order", "table", "fiscal"
    order_id = Column(
        Integer, ForeignKey("orders.id"), nullable=True
    )  # Null para impressões de mesa
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    content = Column(String, nullable=False)  # Conteúdo a ser impresso
    status = Column(String, default=PrintQueueStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    printed_at = Column(DateTime, nullable=True)
    printer = Column(String, nullable=True)  # Nome da impressora
    retry_count = Column(Integer, default=0, nullable=False)  # Contador de tentativas
    error_message = Column(String, nullable=True)  # Mensagem de erro se houver
    fiscal = Column(Boolean, default=False, nullable=False)  # Para impressão da nota da mesa

    # Relacionamentos
    order = relationship("Order", back_populates="print_queue_items")
    table = relationship("Table", back_populates="print_queue_items")
