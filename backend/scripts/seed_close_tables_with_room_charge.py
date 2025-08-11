#!/usr/bin/env python3
"""
Script de seed para fechar mesas com pagamentos ROOM_CHARGE.

Este script fecha algumas mesas que têm pedidos pagos com ROOM_CHARGE
para testar o relatório de consumo do quarto.
"""

import sys
import os
from random import choice, randint, sample
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.crud.table import get_tables, close_table
from app.models.table import Table
from app.models.order import Order
from app.models.payment import Payment
from app.models.payment import PaymentMethod

def main():
    db = SessionLocal()
    try:
        # Buscar mesas abertas que têm pedidos com pagamentos ROOM_CHARGE
        mesas_com_room_charge = []
        
        mesas = get_tables(db, is_closed=False)
        print(f"Verificando {len(mesas)} mesas abertas...")
        
        for mesa in mesas:
            # Buscar pedidos da mesa
            orders = db.query(Order).filter(Order.table_id == mesa.id).all()
            
            if not orders:
                continue
            
            # Verificar se algum pedido tem pagamento ROOM_CHARGE
            for order in orders:
                payment = db.query(Payment).filter(
                    Payment.order_id == order.id,
                    Payment.method == PaymentMethod.ROOM_CHARGE
                ).first()
                
                if payment:
                    mesas_com_room_charge.append(mesa)
                    print(f"Mesa {mesa.name} (ID: {mesa.id}) tem pagamento ROOM_CHARGE")
                    break
        
        if not mesas_com_room_charge:
            print("Nenhuma mesa com pagamentos ROOM_CHARGE encontrada.")
            print("Execute primeiro o script seed_orders_with_payments.py")
            return
        
        # Fechar algumas mesas com ROOM_CHARGE
        num_mesas_para_fechar = min(3, len(mesas_com_room_charge))
        mesas_para_fechar = sample(mesas_com_room_charge, num_mesas_para_fechar)
        
        print(f"\nFechando {len(mesas_para_fechar)} mesas com ROOM_CHARGE...")
        
        for mesa in mesas_para_fechar:
            try:
                # Fechar a mesa usando a função correta
                result = close_table(db, mesa, service_tax=True, closed_by="seed_script")
                
                print(f"✅ Mesa {mesa.name} (ID: {mesa.id}) fechada com sucesso")
                print(f"   Data de fechamento: {mesa.closed_at.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Total: R$ {result['total']:.2f}")
                print(f"   Taxa de serviço: R$ {result['service_tax']:.2f}")
                print(f"   Total com taxa: R$ {result['total_with_service_tax']:.2f}")
                
                # Mostrar pedidos da mesa
                orders = db.query(Order).filter(Order.table_id == mesa.id).all()
                print(f"   Pedidos na mesa: {len(orders)}")
                
                for order in orders:
                    payment = db.query(Payment).filter(Payment.order_id == order.id).first()
                    if payment:
                        print(f"     - Pedido {order.id}: {payment.method} - R$ {payment.amount:.2f}")
                
            except Exception as e:
                print(f"❌ Erro ao fechar mesa {mesa.name}: {e}")
        
        print(f"\nMesas fechadas com sucesso!")
        
        # Mostrar estatísticas
        total_tables = db.query(Table).count()
        closed_tables = db.query(Table).filter(Table.is_closed == True).count()
        room_charge_payments = db.query(Payment).filter(Payment.method == PaymentMethod.ROOM_CHARGE).count()
        
        print(f"\nEstatísticas:")
        print(f"  - Total de mesas: {total_tables}")
        print(f"  - Mesas fechadas: {closed_tables}")
        print(f"  - Pagamentos ROOM_CHARGE: {room_charge_payments}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main() 