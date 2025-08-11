"""
Modelo de categoria de produto.

Este módulo contém o modelo SQLAlchemy para categorias de produtos do sistema.
"""

from sqlalchemy import Boolean, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class Category(Base):
    """Modelo de categoria de produto com informações completas."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    print_queue_id = Column(Integer, ForeignKey("print_queue_configs.id"), nullable=True)
    
    # Relacionamentos
    products = relationship("Product", back_populates="category_rel")
    print_queue_config = relationship("PrintQueueConfig", back_populates="categories") 