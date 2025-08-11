import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.schemas.table import TableCreate
from app.crud.table import create_table

def main():
    db = SessionLocal()
    try:
        for i in range(1, 6):
            table_data = TableCreate(
                name=f"Mesa Teste {i}",
                room_id=None
            )
            try:
                create_table(db, table_data, created_by="seed_script")
                print(f"Mesa Teste {i} criada com sucesso.")
            except Exception as e:
                print(f"Erro ao criar Mesa Teste {i}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 