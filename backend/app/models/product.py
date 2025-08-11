"""
Modelo de produto.

Este módulo contém o modelo SQLAlchemy para produtos do sistema.
"""

from sqlalchemy import Boolean, Column, Float, Integer, String, Time, LargeBinary, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class Product(Base):
    """Modelo de produto com informações completas."""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    image_data = Column(LargeBinary, nullable=True)
    image_filename = Column(String, nullable=True)
    image_content_type = Column(String, nullable=True)
    stock_quantity = Column(Integer, default=0)
    available_from = Column(Time, nullable=True)
    available_until = Column(Time, nullable=True)
    
    # Relacionamento com categoria
    category_rel = relationship("Category", back_populates="products")
