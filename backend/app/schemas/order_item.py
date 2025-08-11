from pydantic import BaseModel, Field


class OrderItemBase(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    comment: str | None = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemUpdate(BaseModel):
    quantity: int | None = Field(None, gt=0)
    unit_price: float | None = Field(None, gt=0)
    comment: str | None = None


class OrderItemOut(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True
