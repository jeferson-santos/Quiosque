import sys
import os
from random import choice

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.schemas.room import RoomCreate
from app.crud.room import create_room

nomes = [
    "João Silva", "Maria Oliveira", "Carlos Souza", "Ana Paula", "Pedro Santos",
    "Juliana Costa", "Lucas Rocha", "Fernanda Lima", "Rafael Alves", "Patrícia Mendes",
    "Bruno Martins", "Camila Ferreira", "Eduardo Ramos", "Larissa Dias", "Gabriel Teixeira"
]

def main():
    db = SessionLocal()
    try:
        for i in range(1, 11):
            numero = f"{100 + i}"
            room_data = RoomCreate(
                number=numero,
                status="available",
                guest_name=choice(nomes)
            )
            try:
                create_room(db, room_data)
                print(f"Quarto {numero} criado com sucesso.")
            except Exception as e:
                print(f"Erro ao criar quarto {numero}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 