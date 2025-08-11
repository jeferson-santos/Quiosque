# app/schemas/category.py

from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    print_queue_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    print_queue_id: Optional[int] = None


class CategoryOut(CategoryBase):
    id: int

    model_config = {"from_attributes": True}


# Temporariamente removendo a referência circular
# class CategoryWithProducts(CategoryOut):
#     products: List["ProductOut"] = []


# Importações circulares temporariamente removidas
# if TYPE_CHECKING:
#     from app.schemas.product import ProductOut

# Rebuild para resolver referências circulares
# CategoryWithProducts.model_rebuild() 