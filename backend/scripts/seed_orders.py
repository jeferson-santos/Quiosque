import sys
import os
from random import choice, randint, sample

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.crud.table import get_tables
from app.crud.product import get_all_products
from app.crud.order import create_order
from app.schemas.order import OrderCreate
from app.schemas.order_item import OrderItemCreate

ORDER_STATUSES = ["pending", "cancelled", "finished"]


def main():
    db = SessionLocal()
    try:
        # Buscar mesas abertas
        mesas = get_tables(db, is_closed=False)
        if not mesas:
            print("Nenhuma mesa aberta encontrada para criar pedidos.")
            return
        # Buscar produtos ativos
        produtos = get_all_products(db, is_active=True)
        if not produtos:
            print("Nenhum produto ativo encontrado para criar pedidos.")
            return
        for mesa in mesas:
            # Cada mesa recebe 1 ou 2 pedidos
            for _ in range(randint(1, 2)):
                n_itens = randint(1, min(3, len(produtos)))
                produtos_escolhidos = sample(produtos, n_itens)
                itens = []
                for prod in produtos_escolhidos:
                    quantidade = randint(1, 3)
                    if prod.stock_quantity < quantidade:
                        continue  # pula produtos sem estoque suficiente
                    itens.append(OrderItemCreate(
                        product_id=prod.id,
                        quantity=quantidade,
                        unit_price=prod.price,
                        comment=None
                    ))
                if not itens:
                    continue
                pedido = OrderCreate(
                    comment=f"Pedido de teste para mesa {mesa.name}",
                    items=itens
                )
                # Usar o usuário que criou a mesa como created_by
                created_by = getattr(mesa, 'created_by', 'seed_script')
                novo_pedido = create_order(db, pedido, mesa.id, created_by=created_by)
                # Atualiza status para diferentes status em alguns pedidos
                status_choice = choice(["pending", "cancelled", "finished"])
                if status_choice != "pending":
                    novo_pedido.status = status_choice
                    db.commit()
                print(f"Pedido criado para mesa {mesa.name} (id={mesa.id}), status: {novo_pedido.status}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 