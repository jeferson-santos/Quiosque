"""
CRUD de pagamentos.

Este módulo contém as operações de banco de dados para pagamentos.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentUpdate


def create_payment(db: Session, payment_data: PaymentCreate, order_id: int) -> Payment:
    """Cria um novo pagamento para um pedido."""

    # Buscar o pedido para obter o valor total
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    # Calcular taxa de serviço (10%)
    service_tax = 0.0
    if payment_data.service_tax_included == "yes":
        service_tax = order.total_amount * 0.10

    # Calcular troco
    total_with_tax = order.total_amount + service_tax
    change = payment_data.amount_paid - total_with_tax

    # Validar se o valor pago é suficiente
    if change < 0:
        raise ValueError("Amount paid is insufficient")

    # Criar o pagamento
    payment = Payment(
        order_id=order_id,
        method=payment_data.method,
        status=PaymentStatus.PENDING,
        amount=order.total_amount,
        amount_paid=payment_data.amount_paid,
        change=change,
        service_tax=service_tax,
        service_tax_included=payment_data.service_tax_included,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_order(db: Session, order_id: int) -> Payment | None:
    """Busca pagamento por ID do pedido."""
    return db.query(Payment).filter(Payment.order_id == order_id).first()


def update_payment(
    db: Session, payment_id: int, payment_update: PaymentUpdate
) -> Payment | None:
    """Atualiza um pagamento existente."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    # Atualizar campos
    update_data = payment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)

    # Se status mudou para PAID, atualizar paid_at
    if payment.status == PaymentStatus.PAID and payment.paid_at is None:
        payment.paid_at = datetime.utcnow()

    # Recalcular troco se amount_paid mudou
    if "amount_paid" in update_data:
        total_with_tax = payment.amount
        if payment.service_tax_included == "yes":
            total_with_tax += payment.service_tax
        payment.change = payment.amount_paid - total_with_tax

    db.commit()
    db.refresh(payment)
    return payment


def process_payment(db: Session, payment_id: int) -> Payment | None:
    """Processa um pagamento (muda status para PAID)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)
    return payment


def cancel_payment(db: Session, payment_id: int) -> Payment | None:
    """Cancela um pagamento."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    payment.status = PaymentStatus.CANCELLED

    db.commit()
    db.refresh(payment)
    return payment


def get_payment_summary(db: Session, order_id: int) -> dict:
    """Obtém resumo de pagamento para um pedido."""
    payment = get_payment_by_order(db, order_id)
    if not payment:
        return None

    total_with_tax = payment.amount
    if payment.service_tax_included == "yes":
        total_with_tax += payment.service_tax

    return {
        "order_id": order_id,
        "total_amount": payment.amount,
        "total_with_tax": total_with_tax,
        "amount_paid": payment.amount_paid,
        "change": payment.change,
        "method": payment.method,
        "status": payment.status,
        "service_tax_included": payment.service_tax_included == "yes",
        "service_tax": payment.service_tax,
    }


def delete_payment(db: Session, payment_id: int):
    """Remove um pagamento."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment:
        db.delete(payment)
        db.commit()
        return True
    return False
