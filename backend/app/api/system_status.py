from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import system_status as system_status_crud
from app.dependencies import get_current_user, get_db
from app.schemas import system_status as system_status_schema
from app.schemas.auth import TokenData

router = APIRouter(prefix="/system", tags=["System Status"])


@router.get("/status", response_model=system_status_schema.SystemStatusOut)
def get_system_status(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Retorna o status atual do sistema."""
    return system_status_crud.get_system_status(db)


@router.patch("/status", response_model=system_status_schema.SystemStatusOut)
def update_system_status(
    updates: system_status_schema.SystemStatusUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Atualiza o status do sistema (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    return system_status_crud.update_system_status(db, updates, current_user.username) 