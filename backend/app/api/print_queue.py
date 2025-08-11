"""
Endpoints para fila de impressão.

Este módulo contém os endpoints para gerenciar a fila de impressão.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import print_queue as print_queue_crud
from app.dependencies import get_current_user, get_db
from app.schemas.auth import TokenData
from app.schemas.print_queue import PrintQueueCreate, PrintQueueOut, PrintQueueUpdate

router = APIRouter(prefix="/print-queue", tags=["Print Queue"])


@router.get("/next", response_model=PrintQueueOut)
def get_next_print_item(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Busca o próximo item pendente na fila de impressão."""
    next_item = print_queue_crud.get_next_print_queue_item(db)
    if not next_item:
        raise HTTPException(
            status_code=404, detail="Nenhum item pendente na fila de impressão"
        )
    return next_item


@router.get("/pending-count")
def get_pending_count(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Retorna o número de itens pendentes na fila de impressão."""
    count = print_queue_crud.get_pending_print_queue_count(db)
    return {"pending_count": count}


@router.get("/all", response_model=List[PrintQueueOut])
def get_all_print_queue_items(
    status: str = None,  # Filtrar por status (pending, printed, error)
    print_type: str = None,  # Filtrar por tipo (order, table, fiscal)
    limit: int = 100,  # Limite de itens retornados
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Retorna todos os itens da fila de impressão com filtros opcionais."""
    return print_queue_crud.get_all_print_queue_items(db, status, print_type, limit)


@router.put("/{print_queue_id}/mark-printed", response_model=PrintQueueOut)
def mark_item_as_printed(
    print_queue_id: int,
    printer: str = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Marca um item como impresso e remove da fila."""
    print_queue_item = print_queue_crud.mark_as_printed(db, print_queue_id, printer)
    if not print_queue_item:
        raise HTTPException(
            status_code=404, detail="Item da fila de impressão não encontrado"
        )
    return print_queue_item


@router.put("/{print_queue_id}/mark-error", response_model=PrintQueueOut)
def mark_item_as_error(
    print_queue_id: int,
    error_message: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Marca um item como erro na impressão."""
    print_queue_item = print_queue_crud.mark_as_error(db, print_queue_id, error_message)
    if not print_queue_item:
        raise HTTPException(
            status_code=404, detail="Item da fila de impressão não encontrado"
        )
    return print_queue_item


@router.delete("/{print_queue_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_print_queue_item(
    print_queue_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Remove um item da fila de impressão."""
    success = print_queue_crud.delete_print_queue_item(db, print_queue_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Item da fila de impressão não encontrado"
        )
