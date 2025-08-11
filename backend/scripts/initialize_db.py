# initialize_db.py

from app.db import Base, engine, SessionLocal
from app.models import user as user_model, table as table_model, order as order_model, order_item as order_item_model, payment as payment_model
from app.models.user import RoleEnum
from app.crud.user import create_user
from app.schemas.user import UserCreate

def reset_database():
    # DERRUBA E CRIA TUDO DE NOVO
    print("🔁 Recriando o banco de dados...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Banco recriado.")

    # CRIA USUÁRIO ADMIN
    db = SessionLocal()
    admin_data = UserCreate(
        username="admin",
        password="admin1234",
        role=RoleEnum.ADMINISTRATOR,
    )

    existing = db.query(user_model.User).filter_by(username="admin").first()
    if not existing:
        print("👤 Criando usuário admin/admin...")
        create_user(db, admin_data)
    else:
        print("⚠️ Usuário admin já existe.")

    # CRIA USUÁRIO WAITER
    waiter_data = UserCreate(
        username="waiter",
        password="waiter1234",
        role=RoleEnum.WAITER,
    )
    existing = db.query(user_model.User).filter_by(username="waiter").first()
    if not existing:
        print("👤 Criando usuário waiter/waiter...")
        create_user(db, waiter_data)
    else:
        print("⚠️ Usuário waiter já existe.")

    db.commit()
    db.close()
    print("✅ Inicialização concluída.")

if __name__ == "__main__":
    reset_database()
