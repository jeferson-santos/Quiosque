from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud.room import create_room, delete_room, disassociate_room_tables, get_room, get_rooms, get_room_tables, update_room
from app.dependencies import get_current_user, get_db
from app.schemas.auth import TokenData
from app.schemas.room import RoomCreate, RoomOut, RoomUpdate
from app.schemas.report import RoomConsumptionReport
from app.schemas.table import TableOut

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("/", response_model=RoomOut, status_code=201)
def create(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can create rooms."
        )
    return create_room(db, room)


@router.get("/", response_model=List[RoomOut])
def list_rooms(
    db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)
):
    return get_rooms(db)


@router.get("/{room_id}", response_model=RoomOut)
def get(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.get("/{room_id}/tables", response_model=List[TableOut])
def get_room_tables_endpoint(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Busca todas as mesas associadas a um quarto."""
    try:
        tables = get_room_tables(db, room_id)
        return tables
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar mesas: {str(e)}")


@router.put("/{room_id}", response_model=RoomOut)
def update(
    room_id: int,
    room_update: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can update rooms."
        )
    return update_room(db, room_id, room_update)


@router.delete("/{room_id}", status_code=204)
def delete(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Exclui um quarto.
    
    ATENÇÃO: Não é possível excluir um quarto que tenha mesas associadas.
    Use o endpoint /rooms/{room_id}/disassociate-tables para desassociar as mesas primeiro.
    """
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can delete rooms."
        )
    delete_room(db, room_id)





@router.get("/{room_id}/consumption-report", response_model=RoomConsumptionReport)
def get_room_consumption_report(
    room_id: int,
    date: str = Query(None, description="Data do relatório (YYYY-MM-DD). Se não informada, usa a data atual"),
    include_all_tables: bool = Query(False, description="Incluir todas as mesas fechadas, mesmo sem pedidos"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de consumo de um quarto específico em uma data."""
    
    # Verificar se o quarto existe
    from app.crud.room import get_room
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    try:
        from app.crud.report import get_room_consumption_report
        report_data = get_room_consumption_report(db, room_id, date, include_all_tables)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{room_id}/print-consumption-report")
def print_room_consumption_report(
    room_id: int,
    date: str = Query(None, description="Data do relatório (YYYY-MM-DD). Se não informada, usa a data atual"),
    include_all_tables: bool = Query(False, description="Incluir todas as mesas fechadas, mesmo sem pedidos"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Adiciona relatório de consumo do quarto à fila de impressão."""
    
    # Verificar se o quarto existe
    from app.crud.room import get_room
    room = get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    try:
        # Gerar o relatório
        from app.crud.report import get_room_consumption_report
        report_data = get_room_consumption_report(db, room_id, date, include_all_tables)
        
        # Adicionar à fila de impressão
        from app.crud.print_queue import create_room_consumption_report_print_item
        print_item = create_room_consumption_report_print_item(db, room_id, date or "hoje", report_data)
        
        return {
            "message": "Relatório de consumo adicionado à fila de impressão",
            "print_queue_id": print_item.id,
            "room_number": room.number,
            "date": report_data["date"],
            "include_all_tables": include_all_tables
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
