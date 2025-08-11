"""
Schemas para fila de impressão.

Este módulo contém os schemas Pydantic para a fila de impressão.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.print_queue import PrintQueueStatus


class PrintQueueBase(BaseModel):
    type: str  # "order", "table", "fiscal"
    table_id: int
    content: str
    order_id: Optional[int] = None
    printer: Optional[str] = None
    fiscal: Optional[bool] = False  # Para impressão da nota da mesa


class PrintQueueCreate(PrintQueueBase):
    pass


class PrintQueueUpdate(BaseModel):
    status: Optional[PrintQueueStatus] = None
    printed_at: Optional[datetime] = None
    printer: Optional[str] = None
    retry_count: Optional[int] = None
    error_message: Optional[str] = None


class PrintQueueOut(PrintQueueBase):
    id: int
    status: str
    created_at: datetime
    printed_at: Optional[datetime] = None
    retry_count: int
    error_message: Optional[str] = None
    fiscal: bool

    model_config = ConfigDict(from_attributes=True)
