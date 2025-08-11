"""
Schemas para configuração de filas de impressão.

Este módulo contém os schemas Pydantic para configuração de filas de impressão.
"""

from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, ConfigDict


class PrintQueueConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    printer_name: Optional[str] = None
    is_default: bool = False


class PrintQueueConfigCreate(PrintQueueConfigBase):
    pass


class PrintQueueConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    printer_name: Optional[str] = None
    is_default: Optional[bool] = None


class PrintQueueConfigOut(PrintQueueConfigBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Removendo referência circular desnecessária por enquanto 