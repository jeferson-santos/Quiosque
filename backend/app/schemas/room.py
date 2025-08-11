from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RoomBase(BaseModel):
    number: str
    status: Optional[str] = "available"
    guest_name: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    status: Optional[str] = None
    guest_name: Optional[str] = None
    closed_at: Optional[datetime] = None


class RoomOut(RoomBase):
    id: int
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
