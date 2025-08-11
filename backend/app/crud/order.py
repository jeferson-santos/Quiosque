from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate, OrderUpdateWithItems, OrderItemAction


def create_order(
    db: Session, order_data: OrderCreate, table_id: int, created_by: str
) -> Order:
    # Criar o pedido
    new_order = Order(
        table_id=table_id,
        comment=order_data.comment,
        status="pending",  # garante o status padrão
        created_by=created_by,
    )
    db.add(new_order)
    db.flush()  # Para obter o ID do pedido

    # Validar estoque de todos os itens antes de criar
    insufficient = []
    for item_data in order_data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            insufficient.append(
                {
                    "product_id": item_data.product_id,
                    "message": f"Produto {item_data.product_id} não encontrado.",
                }
            )
        elif product.stock_quantity < item_data.quantity:
            insufficient.append(
                {
                    "product_id": product.id,
                    "product_name": product.name,
                    "stock_quantity": product.stock_quantity,
                    "requested": item_data.quantity,
                    "message": f"Estoque insuficiente para o produto '{product.name}'. Estoque atual: {product.stock_quantity}, solicitado: {item_data.quantity}.",
                }
            )
    if insufficient:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Um ou mais produtos não possuem estoque suficiente.",
                "products": insufficient,
            },
        )

    # Criar os itens do pedido e atualizar estoque
    for item_data in order_data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        # Decrementar estoque
        product.stock_quantity -= item_data.quantity
        # Se zerar estoque, desativar produto
        if product.stock_quantity == 0:
            product.is_active = False
        db.add(product)

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            comment=item_data.comment,
        )
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order


def update_order(db: Session, order_id: int, order_update: OrderUpdate, updated_by: str = None) -> Order | None:
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None

    # Atualizar só os campos que vierem no objeto
    update_data = order_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)

    # Gravar informações de atualização
    from datetime import datetime
    db_order.updated_at = datetime.utcnow()
    if updated_by:
        db_order.updated_by = updated_by

    # Se o status foi alterado para cancelled, gravar informações de cancelamento
    if "status" in update_data and update_data["status"] == "cancelled":
        db_order.cancelled_at = datetime.utcnow()
        if updated_by:
            db_order.cancelled_by = updated_by

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order_with_items(db: Session, order_id: int, order_update: OrderUpdateWithItems, updated_by: str = None) -> Order | None:
    """Atualiza um pedido incluindo modificações nos itens."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None

    # Atualizar campos básicos do pedido
    update_data = order_update.dict(exclude_unset=True, exclude={"items_actions"})
    for key, value in update_data.items():
        setattr(db_order, key, value)

    # Gravar informações de atualização
    from datetime import datetime
    db_order.updated_at = datetime.utcnow()
    if updated_by:
        db_order.updated_by = updated_by

    # Se o status foi alterado para cancelled, gravar informações de cancelamento
    if "status" in update_data and update_data["status"] == "cancelled":
        db_order.cancelled_at = datetime.utcnow()
        if updated_by:
            db_order.cancelled_by = updated_by

    # Processar ações nos itens
    if order_update.items_actions:
        for action in order_update.items_actions:
            if action.action == "add":
                _add_item_to_order(db, db_order, action)
            elif action.action == "update":
                _update_order_item(db, db_order, action)
            elif action.action == "remove":
                _remove_item_from_order(db, db_order, action)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ação inválida: {action.action}. Ações válidas: add, update, remove"
                )

    db.commit()
    db.refresh(db_order)
    return db_order


def _add_item_to_order(db: Session, order: Order, action: OrderItemAction):
    """Adiciona um item ao pedido."""
    if not action.product_id or not action.quantity or not action.unit_price:
        raise HTTPException(
            status_code=400,
            detail="Para adicionar item: product_id, quantity e unit_price são obrigatórios"
        )

    # Verificar se produto existe e tem estoque
    product = db.query(Product).filter(Product.id == action.product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Produto {action.product_id} não encontrado"
        )

    if product.stock_quantity < action.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Estoque insuficiente para o produto '{product.name}'. Estoque atual: {product.stock_quantity}, solicitado: {action.quantity}"
        )

    # Decrementar estoque
    product.stock_quantity -= action.quantity
    if product.stock_quantity == 0:
        product.is_active = False
    db.add(product)

    # Criar item do pedido
    order_item = OrderItem(
        order_id=order.id,
        product_id=action.product_id,
        quantity=action.quantity,
        unit_price=action.unit_price,
        comment=action.comment,
    )
    db.add(order_item)


def _update_order_item(db: Session, order: Order, action: OrderItemAction):
    """Atualiza um item do pedido."""
    if not action.item_id:
        raise HTTPException(
            status_code=400,
            detail="item_id é obrigatório para atualizar item"
        )

    # Buscar item do pedido
    order_item = db.query(OrderItem).filter(
        OrderItem.id == action.item_id,
        OrderItem.order_id == order.id
    ).first()
    
    if not order_item:
        raise HTTPException(
            status_code=404,
            detail=f"Item {action.item_id} não encontrado no pedido"
        )

    # Buscar produto
    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Produto {order_item.product_id} não encontrado"
        )

    # Calcular diferença de quantidade
    old_quantity = order_item.quantity
    new_quantity = action.quantity or old_quantity
    quantity_diff = new_quantity - old_quantity

    # Se está aumentando a quantidade, verificar estoque
    if quantity_diff > 0:
        if product.stock_quantity < quantity_diff:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para o produto '{product.name}'. Estoque atual: {product.stock_quantity}, necessário: {quantity_diff}"
            )
        # Decrementar estoque
        product.stock_quantity -= quantity_diff
    elif quantity_diff < 0:
        # Se está diminuindo, incrementar estoque
        product.stock_quantity += abs(quantity_diff)

    # Atualizar estoque do produto
    if product.stock_quantity == 0:
        product.is_active = False
    elif not product.is_active and product.stock_quantity > 0:
        product.is_active = True
    db.add(product)

    # Atualizar item do pedido
    if action.quantity is not None:
        order_item.quantity = action.quantity
    if action.unit_price is not None:
        order_item.unit_price = action.unit_price
    if action.comment is not None:
        order_item.comment = action.comment

    db.add(order_item)


def _remove_item_from_order(db: Session, order: Order, action: OrderItemAction):
    """Remove um item do pedido."""
    if not action.item_id:
        raise HTTPException(
            status_code=400,
            detail="item_id é obrigatório para remover item"
        )

    # Buscar item do pedido
    order_item = db.query(OrderItem).filter(
        OrderItem.id == action.item_id,
        OrderItem.order_id == order.id
    ).first()
    
    if not order_item:
        raise HTTPException(
            status_code=404,
            detail=f"Item {action.item_id} não encontrado no pedido"
        )

    # Buscar produto para restaurar estoque
    product = db.query(Product).filter(Product.id == order_item.product_id).first()
    if product:
        # Restaurar estoque
        product.stock_quantity += order_item.quantity
        if product.stock_quantity > 0 and not product.is_active:
            product.is_active = True
        db.add(product)

    # Remover item do pedido
    db.delete(order_item)


def get_order_by_id(db: Session, order_id: int) -> Order | None:
    """Busca um pedido por ID."""
    return db.query(Order).filter(Order.id == order_id).first()


# Alias para manter compatibilidade com código existente
get_order = get_order_by_id


def get_order_by_table(db: Session, table_id: int, order_id: int) -> Order | None:
    return (
        db.query(Order).filter(Order.id == order_id, Order.table_id == table_id).first()
    )


def get_orders_by_table(db: Session, table_id: int) -> list[Order]:
    return db.query(Order).filter(Order.table_id == table_id).all()


def delete_orders_by_table(db: Session, table_id: int):
    db.query(Order).filter(Order.table_id == table_id).delete(synchronize_session=False)
    db.commit()


def delete_order(db: Session, order_id: int):
    db.query(Order).filter(Order.id == order_id).delete(synchronize_session=False)
    db.commit()
