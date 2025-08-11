"""
Modelo de item de pedido.

Este módulo contém o modelo SQLAlchemy para itens individuais de pedidos.
"""

from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class OrderItem(Base):
    """Modelo de item individual em um pedido."""

    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)  # Preço no momento do pedido
    comment = Column(String, nullable=True)  # Comentário específico do item

    # Relacionamentos
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
