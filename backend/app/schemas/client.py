"""
Schemas para clientes.

Este módulo contém os schemas Pydantic para validação de dados de clientes.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ClientBase(BaseModel):
    """Schema base para clientes."""

    name: str
    role: str = "waiter"


class ClientCreate(ClientBase):
    """Schema para criação de clientes."""

    client_id: str
    client_secret: str


class ClientUpdate(BaseModel):
    """Schema para atualização de clientes."""

    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    """Schema para resposta de clientes."""

    id: int
    client_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientLogin(BaseModel):
    """Schema para login de clientes."""

    client_id: str
    client_secret: str


class ClientToken(BaseModel):
    """Schema para token de clientes."""

    access_token: str
    token_type: str = "bearer"
    client_id: str
    role: str


class ClientTokenData(BaseModel):
    """Schema para dados do token de cliente."""

    client_id: str
    role: str
