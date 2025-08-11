import os
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, status, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.crud import category as category_crud
from app.dependencies import get_current_user, get_db
from app.schemas import category as category_schema
from app.schemas.auth import TokenData

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post(
    "/", response_model=category_schema.CategoryOut, status_code=status.HTTP_201_CREATED
)
def create_category(
    category_in: category_schema.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Cria uma nova categoria de produto."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    # Verificar se já existe uma categoria com o mesmo nome
    existing_category = category_crud.get_category_by_name(db, category_in.name)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma categoria com o nome '{category_in.name}'"
        )

    return category_crud.create_category(db, category_in)


@router.get("/", response_model=List[category_schema.CategoryOut])
def get_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Lista todas as categorias, opcionalmente filtradas por status ativo."""
    return category_crud.get_all_categories(db, is_active)


@router.get("/{category_id}", response_model=category_schema.CategoryOut)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Busca uma categoria específica pelo ID."""
    category = category_crud.get_category_with_print_queue(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    return category


# Temporariamente comentado devido a referência circular
# @router.get("/{category_id}/with-products", response_model=category_schema.CategoryWithProducts)
# def get_category_with_products(
#     category_id: int,
#     db: Session = Depends(get_db),
#     current_user: TokenData = Depends(get_current_user),
# ):
#     """Busca uma categoria específica com seus produtos relacionados."""
#     category = category_crud.get_category_with_products(db, category_id)
#     if not category:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
#         )
#     return category


@router.patch("/{category_id}", response_model=category_schema.CategoryOut)
def update_category(
    category_id: int,
    updates: category_schema.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Atualiza uma categoria existente."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    category = category_crud.get_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    # Se estiver tentando atualizar o nome, verificar se já existe
    if updates.name and updates.name != category.name:
        existing_category = category_crud.get_category_by_name(db, updates.name)
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe uma categoria com o nome '{updates.name}'"
            )

    return category_crud.update_category(db, category, updates)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Remove uma categoria."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    category = category_crud.get_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )

    # Verificar se a categoria tem produtos associados
    if category.products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir a categoria '{category.name}' pois ela possui produtos associados"
        )

    category_crud.delete_category(db, category) 