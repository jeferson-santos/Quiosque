from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.room import Room
from app.models.table import Table
from app.schemas.room import RoomCreate, RoomUpdate


def create_room(db: Session, room_data: RoomCreate):
    # Não permitir quartos duplicados pelo número
    existing = (
        db.query(Room)
        .filter(Room.number == room_data.number, Room.closed_at == None)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room {room_data.number} is already active.",
        )
    room = Room(
        number=room_data.number,
        status=room_data.status,
        guest_name=room_data.guest_name,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def get_room(db: Session, room_id: int):
    return db.query(Room).filter(Room.id == room_id).first()


def get_rooms(db: Session, only_active: bool = False):
    query = db.query(Room)
    if only_active:
        query = query.filter(Room.closed_at == None)
    return query.all()


def get_room_tables(db: Session, room_id: int):
    """Busca todas as mesas associadas a um quarto."""
    # Verificar se o quarto existe
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Buscar todas as mesas associadas ao quarto
    tables = db.query(Table).filter(Table.room_id == room_id).all()
    return tables


def disassociate_room_tables(db: Session, room_id: int):
    """Desassocia todas as mesas de um quarto (define room_id como NULL)."""
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Buscar todas as mesas associadas ao quarto
    tables = db.query(Table).filter(Table.room_id == room_id).all()
    
    if not tables:
        raise HTTPException(
            status_code=400,
            detail=f"Não há mesas associadas ao quarto {room.number}"
        )
    
    # Desassociar todas as mesas
    for table in tables:
        table.room_id = None
    
    db.commit()
    
    return {
        "message": f"Desassociadas {len(tables)} mesa(s) do quarto {room.number}",
        "room_id": room_id,
        "room_number": room.number,
        "tables_disassociated": len(tables)
    }


def update_room(db: Session, room_id: int, room_update: RoomUpdate):
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for field, value in room_update.dict(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room_id: int):
    """Exclui um quarto, mas apenas se não houver mesas associadas."""
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Verificar se existem mesas associadas ao quarto
    tables_count = db.query(Table).filter(Table.room_id == room_id).count()
    
    if tables_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir o quarto {room.number}. Existem {tables_count} mesa(s) associada(s) a este quarto. Remova ou desassocie as mesas antes de excluir o quarto."
        )
    
    # Se não há mesas associadas, pode excluir o quarto
    db.delete(room)
    db.commit()
