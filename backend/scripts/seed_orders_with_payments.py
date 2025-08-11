#!/usr/bin/env python3
"""
Script de seed para criar pedidos com pagamentos ROOM_CHARGE.

Este script cria pedidos e pagamentos para testar o relatório de consumo do quarto.
"""

import sys
import os
from random import choice, randint, sample
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.crud.table import get_tables
from app.crud.product import get_all_products
from app.crud.order import create_order
from app.crud.payment import create_payment
from app.schemas.order import OrderCreate
from app.schemas.order_item import OrderItemCreate
from app.schemas.payment import PaymentCreate
from app.models.payment import PaymentMethod

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
        
        print(f"Criando pedidos para {len(mesas)} mesas...")
        
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
                
                # Criar pagamento para pedidos finalizados
                if novo_pedido.status == "finished":
                    # Escolher método de pagamento (50% chance de ser ROOM_CHARGE)
                    payment_method = choice([PaymentMethod.ROOM_CHARGE, PaymentMethod.CASH, PaymentMethod.CARD])
                    
                    # Calcular valor total com taxa de serviço
                    total_with_tax = novo_pedido.total_amount + (novo_pedido.total_amount * 0.10)
                    
                    payment_data = PaymentCreate(
                        method=payment_method,
                        amount_paid=total_with_tax,  # Valor pago pelo cliente
                        service_tax_included="yes",  # Taxa de serviço incluída
                        change=0.0  # Sem troco
                    )
                    
                    try:
                        payment = create_payment(db, payment_data, novo_pedido.id)
                        print(f"  → Pagamento criado: {payment_method.value} - R$ {payment.amount_paid:.2f}")
                    except Exception as e:
                        print(f"  → Erro ao criar pagamento: {e}")
        
        print(f"\nPedidos e pagamentos criados com sucesso!")
        
        # Mostrar estatísticas
        from app.models.order import Order
        from app.models.payment import Payment
        
        total_orders = db.query(Order).count()
        total_payments = db.query(Payment).count()
        room_charge_payments = db.query(Payment).filter(Payment.method == PaymentMethod.ROOM_CHARGE).count()
        
        print(f"\nEstatísticas:")
        print(f"  - Total de pedidos: {total_orders}")
        print(f"  - Total de pagamentos: {total_payments}")
        print(f"  - Pagamentos ROOM_CHARGE: {room_charge_payments}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main() 