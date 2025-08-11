"""
Endpoints para configuração de filas de impressão.

Este módulo contém os endpoints para gerenciar configurações de filas de impressão.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import print_queue_config as print_queue_config_crud
from app.dependencies import get_current_user, get_db
from app.schemas.auth import TokenData
from app.schemas.print_queue_config import (
    PrintQueueConfigCreate,
    PrintQueueConfigOut,
    PrintQueueConfigUpdate,
)

router = APIRouter(prefix="/print-queues", tags=["Print Queues"])


@router.get("/", response_model=List[PrintQueueConfigOut])
def get_print_queues(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Lista todas as filas de impressão."""
    # Verificar permissões: agent pode ler, administrator pode ler
    if current_user.role not in ["agent", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    return print_queue_config_crud.get_all_print_queue_configs(db)


@router.get("/{print_queue_id}", response_model=PrintQueueConfigOut)
def get_print_queue(
    print_queue_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Busca uma fila de impressão específica."""
    # Verificar permissões: agent pode ler, administrator pode ler
    if current_user.role not in ["agent", "administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    print_queue = print_queue_config_crud.get_print_queue_config(db, print_queue_id)
    if not print_queue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Print queue not found"
        )
    return print_queue


@router.post("/", response_model=PrintQueueConfigOut, status_code=status.HTTP_201_CREATED)
def create_print_queue(
    print_queue_in: PrintQueueConfigCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Cria uma nova fila de impressão."""
    # Apenas administrator pode criar
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    return print_queue_config_crud.create_print_queue_config(db, print_queue_in)


@router.put("/{print_queue_id}", response_model=PrintQueueConfigOut)
def update_print_queue(
    print_queue_id: int,
    print_queue_update: PrintQueueConfigUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Atualiza uma fila de impressão existente."""
    # Apenas administrator pode atualizar
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    print_queue = print_queue_config_crud.update_print_queue_config(
        db, print_queue_id, print_queue_update
    )
    if not print_queue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Print queue not found"
        )
    return print_queue


@router.delete("/{print_queue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_print_queue(
    print_queue_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Remove uma fila de impressão."""
    # Apenas administrator pode deletar
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    try:
        success = print_queue_config_crud.delete_print_queue_config(db, print_queue_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Print queue not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) 