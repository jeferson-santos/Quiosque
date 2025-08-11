"""
Operações CRUD para clientes.

Este módulo contém as operações de banco de dados para clientes.
"""

from sqlalchemy.orm import Session

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


def get_client_by_id(db: Session, client_id: int) -> Client | None:
    """Busca um cliente pelo ID."""
    return db.query(Client).filter(Client.id == client_id).first()


def get_client_by_client_id(db: Session, client_id: str) -> Client | None:
    """Busca um cliente pelo client_id."""
    return db.query(Client).filter(Client.client_id == client_id).first()


def get_client_by_client_id_str(db: Session, client_id: str) -> Client | None:
    """Busca um cliente pelo client_id (string)."""
    return db.query(Client).filter(Client.client_id == client_id).first()


def get_clients(db: Session, skip: int = 0, limit: int = 100) -> list[Client]:
    """Busca todos os clientes com paginação."""
    return db.query(Client).offset(skip).limit(limit).all()


def create_client(db: Session, client: ClientCreate) -> Client:
    """Cria um novo cliente."""
    db_client = Client(
        client_id=client.client_id,
        client_secret=client.client_secret,
        name=client.name,
        role=client.role,
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


def update_client(
    db: Session, client_id: int, client_update: ClientUpdate
) -> Client | None:
    """Atualiza um cliente existente."""
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        return None

    update_data = client_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    db.commit()
    db.refresh(db_client)
    return db_client


def delete_client(db: Session, client_id: int) -> bool:
    """Remove um cliente."""
    db_client = get_client_by_id(db, client_id)
    if not db_client:
        return False

    db.delete(db_client)
    db.commit()
    return True


def authenticate_client(
    db: Session, client_id: str, client_secret: str
) -> Client | None:
    """Autentica um cliente usando client_id e client_secret."""
    client = get_client_by_client_id(db, client_id)
    if not client or not client.is_active:
        return None

    # Verifica se o client_secret está correto
    if client.client_secret != client_secret:
        return None

    return client
