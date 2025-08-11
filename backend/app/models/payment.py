"""
Modelo de pagamento.

Este módulo contém o modelo SQLAlchemy para pagamentos do sistema.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db import Base


class PaymentMethod(str, Enum):
    """Enumeração dos métodos de pagamento disponíveis."""

    CASH = "cash"  # Dinheiro
    CARD = "card"  # Cartão
    PIX = "pix"  # PIX
    ROOM_CHARGE = "room_charge"  # Conta do quarto


class PaymentStatus(str, Enum):
    """Enumeração dos status de pagamento."""

    PENDING = "pending"  # Pendente
    PAID = "paid"  # Pago
    CANCELLED = "cancelled"  # Cancelado


class Payment(Base):
    """Modelo de pagamento com controle de troco e taxa de serviço."""

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    method = Column(String, nullable=False)  # PaymentMethod
    status = Column(String, default="pending", nullable=False)  # PaymentStatus
    amount = Column(Float, nullable=False)  # Valor total do pedido
    amount_paid = Column(Float, nullable=False)  # Valor pago pelo cliente
    change = Column(Float, default=0.0)  # Troco
    service_tax = Column(Float, default=0.0)  # Taxa de serviço (10%)
    service_tax_included = Column(String, default="no")  # "yes" ou "no"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    order = relationship("Order", back_populates="payment")

    # Métodos de cálculo serão implementados no CRUD
