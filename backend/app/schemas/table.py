from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TableBase(BaseModel):
    name: str = Field(..., min_length=1)
    room_id: Optional[int] = None  # Associação opcional a quarto


class TableCreate(TableBase):
    pass  # Apenas o nome é necessário na criação


class TableUpdate(BaseModel):
    name: Optional[str] = None
    is_closed: Optional[bool] = None
    room_id: Optional[int] = None


class TableOut(TableBase):
    id: int
    is_closed: bool
    created_by: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    room_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class TableCloseRequest(BaseModel):
    service_tax: bool = Field(
        ..., description="Se deve aplicar 10% de taxa de serviço ao fechar a mesa"
    )
    generate_invoice: bool = Field(
        False, description="Se deve imprimir a nota da mesa ao fechar"
    )
