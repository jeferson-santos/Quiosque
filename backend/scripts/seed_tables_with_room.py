import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.schemas.table import TableCreate
from app.crud.table import create_table
from app.models.room import Room

def main():
    db = SessionLocal()
    try:
        # Buscar o primeiro quarto disponível
        room = db.query(Room).filter(Room.closed_at == None).first()
        if not room:
            print("Nenhum quarto disponível encontrado para vincular as mesas.")
            return
        for i in range(1, 3):
            table_data = TableCreate(
                name=f"Mesa Vinculada {i}",
                room_id=room.id
            )
            try:
                create_table(db, table_data, created_by="seed_script")
                print(f"Mesa Vinculada {i} criada e vinculada ao quarto {room.number} (id={room.id}).")
            except Exception as e:
                print(f"Erro ao criar Mesa Vinculada {i}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 