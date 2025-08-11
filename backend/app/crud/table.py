from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.order import get_orders_by_table
from app.models.room import Room
from app.models.table import Table
from app.schemas.table import TableCreate


def create_table(db: Session, table_data: TableCreate, created_by: str):
    # Verifica se já existe uma mesa com o mesmo nome e que esteja ABERTA
    existing_open_table = (
        db.query(Table)
        .filter(Table.name == table_data.name, Table.is_closed == False)
        .first()
    )
    if existing_open_table:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A table with the name '{table_data.name}' is already open.",
        )

    room_id = getattr(table_data, "room_id", None)
    room = None
    if room_id is not None:
        room = db.query(Room).filter(Room.id == room_id, Room.closed_at == None).first()
        if not room:
            raise HTTPException(
                status_code=400,
                detail="Room must exist and be active to associate with a table.",
            )

    new_table = Table(
        name=table_data.name, is_closed=False, created_by=created_by, room_id=room_id
    )
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    return new_table


def get_table(db: Session, table_id: int) -> Optional[Table]:
    return db.query(Table).filter(Table.id == table_id).first()


def get_tables(db: Session, is_closed: bool) -> list[Table]:
    return db.query(Table).filter(Table.is_closed == is_closed).all()


def close_table(
    db: Session,
    table: Table,
    service_tax: bool = False,
    generate_invoice: bool = False,
    closed_by: str = None,
) -> dict:
    table.is_closed = True
    table.closed_at = datetime.utcnow()
    if closed_by:
        table.closed_by = closed_by
    db.commit()
    db.refresh(table)
    # Calcular total dos pedidos da mesa (excluindo pedidos cancelados)
    orders = get_orders_by_table(db, table.id)
    total = sum(order.total_amount for order in orders if order.status != "cancelled")
    taxa = total * 0.10 if service_tax else 0.0
    total_com_taxa = total + taxa
    return {
        "table": table,
        "total": total,
        "service_tax": taxa,
        "total_with_service_tax": total_com_taxa,
        "service_tax_applied": service_tax,
        "generate_invoice": generate_invoice,
    }


def delete_table(db: Session, table: Table):
    db.delete(table)
    db.commit()


def update_table(db: Session, table_id: int, table_update):
    table = get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    update_data = table_update.dict(exclude_unset=True)
    if "room_id" in update_data and update_data["room_id"] is not None:
        room = (
            db.query(Room)
            .filter(Room.id == update_data["room_id"], Room.closed_at == None)
            .first()
        )
        if not room:
            raise HTTPException(
                status_code=400,
                detail="Room must exist and be active to associate with a table.",
            )
    for key, value in update_data.items():
        setattr(table, key, value)
    db.commit()
    db.refresh(table)
    return table
