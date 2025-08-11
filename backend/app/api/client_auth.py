"""
Endpoints para autenticação de clientes.

Este módulo contém os endpoints para autenticação e gerenciamento de clientes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_client_token
from app.crud.client import (
    authenticate_client,
    create_client,
    delete_client,
    get_client_by_client_id_str,
    get_client_by_id,
    get_clients,
    update_client,
)
from app.dependencies import get_current_user, get_db
from app.schemas.client import (
    ClientCreate,
    ClientLogin,
    ClientResponse,
    ClientToken,
    ClientUpdate,
)

router = APIRouter(prefix="/client", tags=["Client Auth"])


@router.post("/login", response_model=ClientToken)
def client_login(client_login: ClientLogin, db: Session = Depends(get_db)):
    """Endpoint para login de clientes usando client_id e client_secret."""
    client = authenticate_client(db, client_login.client_id, client_login.client_secret)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client credentials",
        )

    token = create_client_token(client_id=client.client_id, role=client.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "client_id": client.client_id,
        "role": client.role,
    }


@router.post("/", response_model=ClientResponse)
def create_new_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Cria um novo cliente (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create clients",
        )

    # Verifica se já existe um cliente com o mesmo client_id
    existing_client = get_client_by_client_id_str(db, client.client_id)
    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client ID already exists",
        )

    return create_client(db, client)


@router.get("/", response_model=list[ClientResponse])
def list_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lista todos os clientes (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list clients",
        )

    return get_clients(db, skip=skip, limit=limit)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Obtém um cliente específico (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view client details",
        )

    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client_details(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Atualiza um cliente (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update clients",
        )

    client = update_client(db, client_id, client_update)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    return client


@router.delete("/{client_id}")
def delete_client_endpoint(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Remove um cliente (apenas administradores)."""
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete clients",
        )

    success = delete_client(db, client_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    return {"message": "Client deleted successfully"}
