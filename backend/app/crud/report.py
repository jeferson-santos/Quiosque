"""
CRUD de relatórios.

Este módulo contém as operações de banco de dados para relatórios.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import and_, extract, func
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment, PaymentStatus
from app.models.product import Product
from app.models.report import Report, ReportType
from app.models.table import Table
from app.models.user import User


def get_daily_sales_report(db: Session, date: str) -> Dict:
    """Gera relatório de vendas diárias."""

    # Converter string para datetime
    report_date = datetime.strptime(date, "%Y-%m-%d")
    next_date = report_date + timedelta(days=1)

    # Buscar pedidos do dia
    orders = (
        db.query(Order)
        .filter(and_(Order.created_at >= report_date, Order.created_at < next_date))
        .all()
    )

    # Buscar pagamentos do dia
    payments = (
        db.query(Payment)
        .filter(and_(Payment.created_at >= report_date, Payment.created_at < next_date))
        .all()
    )

    # Calcular totais (excluindo pedidos cancelados)
    total_orders = len(orders)
    total_revenue = sum(order.total_amount for order in orders if order.status != "cancelled")
    total_revenue_with_tax = sum(
        payment.amount + payment.service_tax for payment in payments
    )
    total_service_tax = sum(payment.service_tax for payment in payments)
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0

    # Contar por status
    orders_by_status = {}
    for order in orders:
        status = order.status
        orders_by_status[status] = orders_by_status.get(status, 0) + 1

    # Resumo de métodos de pagamento
    payment_methods_summary = {}
    for payment in payments:
        method = payment.method
        payment_methods_summary[method] = payment_methods_summary.get(method, 0) + 1

    # Top produtos do dia
    top_products = (
        db.query(
            Product.name,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_revenue"),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(and_(Order.created_at >= report_date, Order.created_at < next_date))
        .group_by(Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(10)
        .all()
    )

    top_products_list = [
        {
            "name": product.name,
            "quantity_sold": int(product.total_quantity),
            "revenue": float(product.total_revenue),
        }
        for product in top_products
    ]

    return {
        "date": date,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_revenue_with_tax": total_revenue_with_tax,
        "total_service_tax": total_service_tax,
        "average_order_value": average_order_value,
        "orders_by_status": orders_by_status,
        "payment_methods_summary": payment_methods_summary,
        "top_products": top_products_list,
    }


def get_top_products_report(db: Session, limit: int = 10, days: int = 30) -> Dict:
    """Gera relatório de produtos mais vendidos."""

    # Calcular período
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Buscar produtos mais vendidos
    top_products = (
        db.query(
            Product.name,
            Product.category,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_revenue"),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(and_(Order.created_at >= start_date, Order.created_at <= end_date))
        .group_by(Product.name, Product.category)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )

    total_quantity_sold = sum(int(product.total_quantity) for product in top_products)
    total_revenue_from_products = sum(
        float(product.total_revenue) for product in top_products
    )

    products_list = [
        {
            "name": product.name,
            "category": product.category,
            "quantity_sold": int(product.total_quantity),
            "revenue": float(product.total_revenue),
            "average_price": (
                float(product.total_revenue) / int(product.total_quantity)
                if product.total_quantity > 0
                else 0
            ),
        }
        for product in top_products
    ]

    return {
        "period": f"Últimos {days} dias",
        "limit": limit,
        "products": products_list,
        "total_quantity_sold": total_quantity_sold,
        "total_revenue_from_products": total_revenue_from_products,
    }


def get_waiter_commission_report(
    db: Session, start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Dict:
    """Gera relatório de comissão de garçons."""

    # Definir período
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        period = f"{start_date} a {end_date}"
    else:
        # Últimos 30 dias por padrão
        end = datetime.now()
        start = end - timedelta(days=30)
        period = "Últimos 30 dias"

    # Buscar garçons
    waiters = db.query(User).filter(User.role == "waiter").all()

    commission_rate = 0.10  # 10%
    total_commission = 0
    total_orders = 0
    total_revenue = 0
    waiters_data = []

    for waiter in waiters:
        # Buscar mesas criadas pelo garçom
        tables = (
            db.query(Table)
            .filter(
                and_(
                    Table.created_by == waiter.username,
                    Table.created_at >= start,
                    Table.created_at <= end,
                )
            )
            .all()
        )

        waiter_orders = []
        waiter_revenue = 0

        for table in tables:
            orders = (
                db.query(Order)
                .filter(
                    and_(
                        Order.table_id == table.id,
                        Order.created_at >= start,
                        Order.created_at <= end,
                    )
                )
                .all()
            )

            for order in orders:
                waiter_orders.append(order)
                waiter_revenue += order.total_amount

        waiter_commission = waiter_revenue * commission_rate
        total_commission += waiter_commission
        total_orders += len(waiter_orders)
        total_revenue += waiter_revenue

        waiters_data.append(
            {
                "username": waiter.username,
                "orders_count": len(waiter_orders),
                "revenue": waiter_revenue,
                "commission": waiter_commission,
                "tables_created": len(tables),
            }
        )

    return {
        "period": period,
        "total_commission": total_commission,
        "commission_rate": commission_rate,
        "waiters": waiters_data,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
    }


def get_payment_methods_report(db: Session, days: int = 30) -> Dict:
    """Gera relatório de métodos de pagamento."""

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Buscar pagamentos do período
    payments = (
        db.query(Payment)
        .filter(and_(Payment.created_at >= start_date, Payment.created_at <= end_date))
        .all()
    )

    total_transactions = len(payments)
    total_revenue = sum(payment.amount + payment.service_tax for payment in payments)

    # Agrupar por método
    methods_data = {}
    for payment in payments:
        method = payment.method
        if method not in methods_data:
            methods_data[method] = {"count": 0, "total_amount": 0, "average_amount": 0}

        methods_data[method]["count"] += 1
        methods_data[method]["total_amount"] += payment.amount + payment.service_tax

    # Calcular médias
    for method in methods_data:
        count = methods_data[method]["count"]
        total = methods_data[method]["total_amount"]
        methods_data[method]["average_amount"] = total / count if count > 0 else 0

    methods_list = [
        {
            "method": method,
            "count": data["count"],
            "total_amount": data["total_amount"],
            "average_amount": data["average_amount"],
            "percentage": (
                (data["count"] / total_transactions * 100)
                if total_transactions > 0
                else 0
            ),
        }
        for method, data in methods_data.items()
    ]

    return {
        "period": f"Últimos {days} dias",
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
        "methods": methods_list,
    }


def get_table_performance_report(db: Session, days: int = 30) -> Dict:
    """Gera relatório de performance das mesas."""

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # Buscar mesas do período
    tables = (
        db.query(Table)
        .filter(and_(Table.created_at >= start_date, Table.created_at <= end_date))
        .all()
    )

    total_tables = len(tables)
    active_tables = len([t for t in tables if not t.is_closed])
    closed_tables = len([t for t in tables if t.is_closed])

    tables_data = []
    total_orders = 0
    total_revenue = 0

    for table in tables:
        orders = db.query(Order).filter(Order.table_id == table.id).all()
        table_revenue = sum(order.total_amount for order in orders if order.status != "cancelled")

        tables_data.append(
            {
                "name": table.name,
                "is_closed": table.is_closed,
                "orders_count": len(orders),
                "revenue": table_revenue,
                "created_at": (
                    table.created_at.isoformat() if table.created_at else None
                ),
                "closed_at": table.closed_at.isoformat() if table.closed_at else None,
            }
        )

        total_orders += len(orders)
        total_revenue += table_revenue

    average_orders_per_table = total_orders / total_tables if total_tables > 0 else 0
    average_revenue_per_table = total_revenue / total_tables if total_tables > 0 else 0

    return {
        "period": f"Últimos {days} dias",
        "total_tables": total_tables,
        "active_tables": active_tables,
        "closed_tables": closed_tables,
        "average_orders_per_table": average_orders_per_table,
        "average_revenue_per_table": average_revenue_per_table,
        "tables": tables_data,
    }


def get_hourly_sales_report(db: Session, date: str) -> Dict:
    """Gera relatório de vendas por hora."""

    report_date = datetime.strptime(date, "%Y-%m-%d")
    next_date = report_date + timedelta(days=1)

    # Buscar pedidos do dia
    orders = (
        db.query(Order)
        .filter(and_(Order.created_at >= report_date, Order.created_at < next_date))
        .all()
    )

    # Agrupar por hora
    hourly_data = {}
    for hour in range(24):
        hourly_data[hour] = {"orders_count": 0, "revenue": 0, "hour": f"{hour:02d}:00"}

    for order in orders:
        if order.status != "cancelled":
            hour = order.created_at.hour
            hourly_data[hour]["orders_count"] += 1
            hourly_data[hour]["revenue"] += order.total_amount

    # Converter para lista e encontrar picos
    hourly_list = list(hourly_data.values())
    peak_hours = []
    max_revenue = max(data["revenue"] for data in hourly_list)

    for data in hourly_list:
        if data["revenue"] == max_revenue and max_revenue > 0:
            peak_hours.append(data["hour"])

    total_revenue = sum(data["revenue"] for data in hourly_list)
    total_orders = sum(data["orders_count"] for data in hourly_list)

    return {
        "date": date,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "hourly_data": hourly_list,
        "peak_hours": peak_hours,
    }


def get_user_sales_report(
    db: Session,
    username: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict:
    """Gera relatório de vendas de um usuário específico."""

    # Definir período
    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        period = f"{start_date} a {end_date}"
    else:
        # Hoje por padrão
        start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        period = f"Hoje ({start.strftime('%Y-%m-%d')})"

    # Buscar usuário
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise ValueError(f"Usuário '{username}' não encontrado")

    # Buscar mesas criadas pelo usuário no período
    tables = (
        db.query(Table)
        .filter(
            and_(
                Table.created_by == username,
                Table.created_at >= start,
                Table.created_at <= end,
            )
        )
        .all()
    )

    total_tables_created = len(tables)
    active_tables = len([t for t in tables if not t.is_closed])
    closed_tables = len([t for t in tables if t.is_closed])

    # Buscar pedidos das mesas criadas pelo usuário
    table_ids = [table.id for table in tables]
    orders = []
    if table_ids:
        orders = (
            db.query(Order)
            .filter(
                and_(
                    Order.table_id.in_(table_ids),
                    Order.created_at >= start,
                    Order.created_at <= end,
                )
            )
            .all()
        )

    # Buscar pagamentos dos pedidos
    order_ids = [order.id for order in orders]
    payments = []
    if order_ids:
        payments = (
            db.query(Payment)
            .filter(
                and_(
                    Payment.order_id.in_(order_ids),
                    Payment.created_at >= start,
                    Payment.created_at <= end,
                )
            )
            .all()
        )

    # Calcular métricas (excluindo pedidos cancelados)
    total_orders = len(orders)
    total_revenue = sum(order.total_amount for order in orders if order.status != "cancelled")
    total_revenue_with_tax = sum(
        payment.amount + payment.service_tax for payment in payments
    )
    total_service_tax = sum(payment.service_tax for payment in payments)
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0

    # Contar por status
    orders_by_status = {}
    for order in orders:
        status = order.status
        orders_by_status[status] = orders_by_status.get(status, 0) + 1

    # Resumo de métodos de pagamento
    payment_methods_summary = {}
    for payment in payments:
        method = payment.method
        payment_methods_summary[method] = payment_methods_summary.get(method, 0) + 1

    # Top produtos vendidos pelo usuário
    top_products = []
    if orders:
        top_products = (
            db.query(
                Product.name,
                func.sum(OrderItem.quantity).label("total_quantity"),
                func.sum(OrderItem.quantity * OrderItem.unit_price).label(
                    "total_revenue"
                ),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                and_(
                    Order.id.in_(order_ids),
                    Order.created_at >= start,
                    Order.created_at <= end,
                )
            )
            .group_by(Product.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(10)
            .all()
        )

    top_products_list = [
        {
            "name": product.name,
            "quantity_sold": int(product.total_quantity),
            "revenue": float(product.total_revenue),
        }
        for product in top_products
    ]

    return {
        "period": period,
        "username": username,
        "user_role": user.role,
        "total_tables_created": total_tables_created,
        "active_tables": active_tables,
        "closed_tables": closed_tables,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_revenue_with_tax": total_revenue_with_tax,
        "total_service_tax": total_service_tax,
        "average_order_value": average_order_value,
        "orders_by_status": orders_by_status,
        "payment_methods_summary": payment_methods_summary,
        "top_products_sold": top_products_list,
    }


def save_report(
    db: Session,
    report_type: str,
    data: Dict,
    generated_by: str,
    parameters: Optional[str] = None,
) -> Report:
    """Salva um relatório gerado."""

    report = Report(
        report_type=report_type,
        generated_by=generated_by,
        parameters=parameters,
        data=json.dumps(data, default=str),
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_room_consumption_report(
    db: Session, room_id: int, date: str = None, include_all_tables: bool = False
) -> Dict:
    """Gera relatório de consumo de um quarto específico em uma data."""
    
    from app.models.room import Room
    from datetime import datetime, timedelta
    
    # Verificar se o quarto existe
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise ValueError(f"Quarto com ID {room_id} não encontrado")
    
    # Usar data atual se não fornecida
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Converter string para datetime
    report_date = datetime.strptime(date, "%Y-%m-%d")
    next_date = report_date + timedelta(days=1)
    
    # Buscar mesas associadas ao quarto que foram fechadas no dia específico
    # Filtrar por data de fechamento (closed_at) em vez de data de criação
    tables = (
        db.query(Table)
        .filter(
            and_(
                Table.room_id == room_id,
                Table.is_closed == True,
                Table.closed_at >= report_date,
                Table.closed_at < next_date
            )
        )
        .all()
    )
    
    # Buscar pedidos das mesas fechadas
    table_ids = [table.id for table in tables]
    orders = []
    if table_ids:
        orders = (
            db.query(Order)
            .filter(
                and_(
                    Order.table_id.in_(table_ids),
                    Order.created_at >= report_date,
                    Order.created_at < next_date
                )
            )
            .all()
        )
    
    # Buscar pagamentos dos pedidos
    order_ids = [order.id for order in orders]
    payments = []
    if order_ids:
        payments = (
            db.query(Payment)
            .filter(
                and_(
                    Payment.order_id.in_(order_ids),
                    Payment.created_at >= report_date,
                    Payment.created_at < next_date
                )
            )
            .all()
        )
    
    # Filtrar apenas pagamentos com "ROOM_CHARGE"
    room_charge_payments = [p for p in payments if p.method == "room_charge"]
    
    # Obter IDs dos pedidos que foram pagos com "ROOM_CHARGE"
    room_charge_order_ids = [p.order_id for p in room_charge_payments]
    
    # Filtrar pedidos para incluir apenas os que foram pagos com "ROOM_CHARGE"
    orders = [order for order in orders if order.id in room_charge_order_ids]
    
    # Recalcular order_ids baseado nos pedidos filtrados
    order_ids = [order.id for order in orders]
    
    # Buscar itens dos pedidos filtrados
    order_items = []
    if order_ids:
        order_items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id.in_(order_ids))
            .all()
        )
    
    # Recalcular pagamentos baseado nos pedidos filtrados
    payments = [p for p in payments if p.order_id in order_ids]
    
    # Calcular métricas (excluindo pedidos cancelados)
    total_tables = len(tables)
    total_orders = len(orders)
    total_revenue = sum(order.total_amount for order in orders if order.status != "cancelled")
    total_revenue_with_tax = sum(
        payment.amount + payment.service_tax for payment in payments
    )
    total_service_tax = sum(payment.service_tax for payment in payments)
    total_items = sum(item.quantity for item in order_items)
    
    # Agrupar itens por produto
    products_consumption = {}
    for item in order_items:
        product_name = item.product.name
        if product_name not in products_consumption:
            products_consumption[product_name] = {
                "quantity": 0,
                "total_amount": 0,
                "unit_price": item.unit_price
            }
        products_consumption[product_name]["quantity"] += item.quantity
        products_consumption[product_name]["total_amount"] += item.quantity * item.unit_price
    
    # Converter para lista ordenada por quantidade
    products_list = [
        {
            "name": name,
            "quantity": data["quantity"],
            "total_amount": data["total_amount"],
            "unit_price": data["unit_price"]
        }
        for name, data in products_consumption.items()
    ]
    products_list.sort(key=lambda x: x["quantity"], reverse=True)
    
    # Agrupar por mesa
    tables_consumption = []
    for table in tables:
        table_orders = [o for o in orders if o.table_id == table.id]
        
        # Se include_all_tables=True, incluir todas as mesas fechadas
        # Se include_all_tables=False, incluir apenas mesas com pedidos
        if include_all_tables or table_orders:
            table_revenue = sum(order.total_amount for order in table_orders if order.status != "cancelled")
            table_items = sum(
                item.quantity 
                for item in order_items 
                if item.order_id in [o.id for o in table_orders]
            )
            
            tables_consumption.append({
                "name": table.name,
                "orders_count": len(table_orders),
                "total_items": table_items,
                "revenue": table_revenue,
                "created_at": table.created_at.isoformat() if table.created_at else None,
                "closed_at": table.closed_at.isoformat() if table.closed_at else None,
                "created_by": table.created_by,
                "closed_by": table.closed_by
            })
    
    # Contar por status dos pedidos
    orders_by_status = {}
    for order in orders:
        status = order.status
        orders_by_status[status] = orders_by_status.get(status, 0) + 1
    
    return {
        "room_id": room_id,
        "room_number": room.number,
        "guest_name": room.guest_name,
        "date": date,
        "total_tables": total_tables,
        "total_orders": total_orders,
        "total_items": total_items,
        "total_revenue": total_revenue,
        "total_revenue_with_tax": total_revenue_with_tax,
        "total_service_tax": total_service_tax,
        "average_order_value": total_revenue / total_orders if total_orders > 0 else 0,
        "orders_by_status": orders_by_status,
        "products_consumption": products_list,
        "tables_consumption": tables_consumption,
        "include_all_tables": include_all_tables
    }
