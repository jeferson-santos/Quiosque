"""
Autenticação simplificada de cliente para ambiente Docker.

Este módulo fornece autenticação simples baseada em configurações fixas
para uso em ambiente Docker onde a API confia no cliente.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import create_client_token
from app.dependencies import get_db
from app.schemas.client import ClientLogin, ClientToken

settings = Settings()
router = APIRouter(prefix="/client", tags=["Client Auth"])


@router.post("/login", response_model=ClientToken)
def client_login(client_login: ClientLogin):
    """Endpoint simplificado para login de cliente usando configurações fixas."""

    # Verifica se as credenciais correspondem às configurações
    if (
        client_login.client_id != settings.CLIENT_ID
        or client_login.client_secret != settings.CLIENT_SECRET
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client credentials",
        )

    # Cria token com role configurada
    token = create_client_token(client_id=settings.CLIENT_ID, role=settings.CLIENT_ROLE)

    return {
        "access_token": token,
        "token_type": "bearer",
        "client_id": settings.CLIENT_ID,
        "role": settings.CLIENT_ROLE,
    }


@router.get("/info")
def get_client_info():
    """Retorna informações do cliente configurado."""
    return {
        "client_id": settings.CLIENT_ID,
        "role": settings.CLIENT_ROLE,
        "environment": "docker",
    }
