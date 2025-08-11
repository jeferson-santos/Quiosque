"""
Modelo de configuração de filas de impressão.

Este módulo contém o modelo SQLAlchemy para configuração de filas de impressão.
"""

from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


class PrintQueueConfig(Base):
    """Modelo de configuração de fila de impressão."""

    __tablename__ = "print_queue_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)
    printer_name = Column(String, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Relacionamento com categorias
    categories = relationship("Category", back_populates="print_queue_config") 