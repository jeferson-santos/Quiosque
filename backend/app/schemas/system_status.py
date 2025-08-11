from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class SystemStatusBase(BaseModel):
    orders_enabled: bool = True
    reason: Optional[str] = None


class SystemStatusUpdate(BaseModel):
    orders_enabled: bool
    reason: Optional[str] = None


class SystemStatusOut(SystemStatusBase):
    id: int
    updated_by: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True} 