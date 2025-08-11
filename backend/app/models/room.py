"""
Modelo de quarto (Room).

Este módulo contém o modelo SQLAlchemy para quartos do hotel.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.db import Base


class Room(Base):
    """Modelo de quarto do hotel."""

    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(
        String, nullable=False, index=True
    )  # Número ou identificador do quarto
    status = Column(
        String, nullable=False, default="available"
    )  # Ex: available, occupied, maintenance
    guest_name = Column(String, nullable=True)  # Nome do hóspede atual (opcional)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    # Relacionamento futuro: tables = relationship("Table", back_populates="room")
