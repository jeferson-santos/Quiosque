import os
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, status, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.crud import product as product_crud
from app.dependencies import get_current_user, get_db
from app.schemas import product as product_schema
from app.schemas.auth import TokenData

router = APIRouter(prefix="/products", tags=["Products"])


@router.post(
    "/", response_model=product_schema.ProductOut, status_code=status.HTTP_201_CREATED
)
def create_product(
    product_in: product_schema.ProductCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    return product_crud.create_product(db, product_in)


@router.get("/", response_model=List[product_schema.ProductWithCategory])
def get_products(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Lista produtos com informações de suas categorias."""
    return product_crud.get_all_products(db, is_active, category_id)


@router.get("/{product_id}", response_model=product_schema.ProductWithCategory)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Busca um produto específico com informações da sua categoria."""
    product = product_crud.get_product_with_category(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    product_crud.delete_product(db, product)


@router.patch("/{product_id}", response_model=product_schema.ProductOut)
def update_product(
    product_id: int,
    updates: product_schema.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    return product_crud.update_product(db, product, updates)


@router.patch("/{product_id}/increase_stock", response_model=product_schema.ProductOut)
def increase_product_stock(
    product_id: int,
    quantity: int = Body(..., embed=True, gt=0),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    try:
        return product_crud.increase_stock(db, product, quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{product_id}/decrease_stock", response_model=product_schema.ProductOut)
def decrease_product_stock(
    product_id: int,
    quantity: int = Body(..., embed=True, gt=0),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    product = product_crud.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    try:
        return product_crud.decrease_stock(db, product, quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Configurações para upload de imagem
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image_file(file: UploadFile) -> None:
    """Valida o arquivo de imagem."""
    # Verificar extensão
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Tipos permitidos: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Verificar tamanho do arquivo
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )


@router.post("/{product_id}/upload_image", status_code=status.HTTP_201_CREATED)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Upload de imagem para um produto específico.
    
    A imagem será salva diretamente no banco de dados na coluna image_data.
    """
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    try:
        # Verificar se o produto existe
        product = product_crud.get_product(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado"
            )
        
        # Validar arquivo
        validate_image_file(file)
        
        # Ler o conteúdo do arquivo
        image_content = file.file.read()
        
        # Atualizar o produto com a imagem
        product.image_data = image_content
        product.image_filename = file.filename
        product.image_content_type = file.content_type
        
        # Salvar no banco de dados
        db.commit()
        db.refresh(product)
        
        return {
            "message": "Imagem do produto enviada com sucesso",
            "product_id": product_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(image_content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar upload: {str(e)}"
        )


@router.get("/{product_id}/image")
async def get_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Retorna a imagem de um produto específico.
    """
    try:
        # Buscar o produto
        product = product_crud.get_product(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado"
            )
        
        if not product.image_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não possui imagem"
            )
        
        # Retornar a imagem como resposta
        return Response(
            content=product.image_data,
            media_type=product.image_content_type or "image/jpeg"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter imagem: {str(e)}"
        )





@router.delete("/{product_id}/image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Remove a imagem de um produto específico.
    """
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    try:
        # Buscar o produto
        product = product_crud.get_product(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado"
            )
        
        if not product.image_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não possui imagem"
            )
        
        # Remover a imagem
        product.image_data = None
        product.image_filename = None
        product.image_content_type = None
        
        # Salvar no banco de dados
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover imagem: {str(e)}"
        )
