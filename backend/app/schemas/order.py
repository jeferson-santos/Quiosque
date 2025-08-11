from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus
from app.schemas.order_item import OrderItemCreate, OrderItemOut, OrderItemUpdate


class OrderBase(BaseModel):
    comment: Optional[str] = None
    status: OrderStatus


class OrderCreate(BaseModel):
    comment: str | None = None
    items: List[OrderItemCreate]


class OrderOut(OrderBase):
    id: int
    table_id: int
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    items: List[OrderItemOut]
    total_amount: float
    total_items: int

    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(OrderBase):
    comment: Optional[str] = None
    status: Optional[OrderStatus] = None

    model_config = ConfigDict(from_attributes=True)


class OrderItemAction(BaseModel):
    """Schema para ações em itens de pedido."""
    action: str = Field(..., description="'add', 'update', ou 'remove'")
    item_id: Optional[int] = Field(None, description="ID do item (obrigatório para update/remove)")
    product_id: Optional[int] = Field(None, description="ID do produto (obrigatório para add)")
    quantity: Optional[int] = Field(None, gt=0, description="Quantidade (obrigatório para add/update)")
    unit_price: Optional[float] = Field(None, gt=0, description="Preço unitário (obrigatório para add/update)")
    comment: Optional[str] = None


class OrderUpdateWithItems(BaseModel):
    """Schema para atualização de pedido com modificação de itens."""
    comment: Optional[str] = None
    status: Optional[OrderStatus] = None
    items_actions: Optional[List[OrderItemAction]] = None

    model_config = ConfigDict(from_attributes=True)
