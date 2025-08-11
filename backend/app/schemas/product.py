# app/schemas/product.py

from datetime import time
from typing import Optional

from pydantic import BaseModel, HttpUrl


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    is_active: bool = True
    category_id: int
    image_filename: Optional[str] = None
    image_content_type: Optional[str] = None
    stock_quantity: Optional[int] = None
    available_from: Optional[time] = None
    available_until: Optional[time] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None
    image_filename: Optional[str] = None
    image_content_type: Optional[str] = None
    stock_quantity: Optional[int] = None
    available_from: Optional[time] = None
    available_until: Optional[time] = None


class ProductOut(ProductBase):
    id: int

    model_config = {"from_attributes": True}


class ProductWithCategory(ProductOut):
    category: Optional["CategoryOut"] = None


# Importação circular para CategoryOut
from app.schemas.category import CategoryOut
ProductWithCategory.model_rebuild()
