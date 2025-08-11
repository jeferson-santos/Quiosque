import json
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import print_queue as print_queue_crud
from app.crud import table as table_crud
from app.crud.order import get_orders_by_table
from app.crud.table import create_table
from app.dependencies import get_current_user, get_db
from app.models.product import Product
from app.schemas.auth import TokenData
from app.schemas.print_queue import PrintQueueCreate
from app.schemas.table import TableCloseRequest, TableCreate, TableOut, TableUpdate
from app.schemas.order import OrderCreate, OrderOut, OrderUpdate, OrderUpdateWithItems
from app.crud import order as order_crud
from app.crud import system_status as system_status_crud

router = APIRouter(prefix="/tables", tags=["Tables"])


# Criar mesa - qualquer usuário logado
@router.post("/", response_model=TableOut, status_code=201)
def create_table_endpoint(
    table: TableCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    return create_table(db, table, created_by=current_user.username)


@router.get("/", response_model=list[TableOut])
def get_tables(
    is_closed: bool = Query(
        ..., description="Filter by table closed status (true/false)"
    ),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    return table_crud.get_tables(db, is_closed)


# Remover mesa - só administrador
@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
        )

    from app.crud import order as order_crud

    order_crud.delete_orders_by_table(db, table_id)
    table_crud.delete_table(db, table)


# Fechar mesa - só administrador
@router.put(
    "/{table_id}/close",
    response_model=None,  # Resposta customizada
    status_code=status.HTTP_200_OK,
)
def close_table(
    table_id: int,
    close_req: TableCloseRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role not in ("administrator", "waiter"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
        )
    if table.is_closed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Table already closed"
        )

    result = table_crud.close_table(
        db,
        table,
        service_tax=close_req.service_tax,
        generate_invoice=close_req.generate_invoice,
        closed_by=current_user.username,
    )
    # Buscar todos os pedidos da mesa
    orders = get_orders_by_table(db, table_id)
    if not orders:
        return {
            "message": "Mesa fechada com sucesso",
            "table_id": table_id,
            "total_amount": 0.0,
            "orders_count": 0,
            "orders": []
        }

    # Calcular total dos pedidos (excluindo pedidos cancelados)
    total_amount = sum(order.total_amount for order in orders if order.status != "cancelled")
    orders_count = len([order for order in orders if order.status != "cancelled"])

    # Preparar dados dos pedidos para resposta
    orders_data = []
    for order in orders:
        if order.status != "cancelled":
            order_data = {
                "id": order.id,
                "status": order.status,
                "total_amount": order.total_amount,
                "total_items": order.total_items,
                "created_at": order.created_at.isoformat(),
                "created_by": order.created_by,
                "items": [
                    {
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "comment": item.comment,
                    }
                    for item in order.items
                ],
            }
            orders_data.append(order_data)

    # Gera conteúdo para impressão da conta
    lines = [
        f"{table.name.center(32)}",
        "=" * 32,
        f"CONTA FECHADA",
        f"Data: {result['closed_at'].strftime('%d/%m/%Y %H:%M')}",
        f"Fechada por: {result['closed_by']}",
        "-" * 32,
        "Pedidos:",
    ]

    for order_data in orders_data:
        lines.append(f"Pedido #{order_data['id']} - {order_data['status']}")
        for item in order_data["items"]:
            product = db.query(Product).filter(Product.id == item["product_id"]).first()
            product_name = product.name if product else f"ID {item['product_id']}"
            subtotal = item["quantity"] * item["unit_price"]
            lines.append(
                f"  {item['quantity']}x {product_name[:20].ljust(20)} R$ {subtotal:6.2f}"
            )
            if item["comment"]:
                lines.append(f"     Obs: {item['comment']}")

    lines.append("-" * 32)
    lines.append(f"Total de pedidos: {orders_count}")
    lines.append(f"Subtotal: R$ {total_amount:.2f}")
    
    if close_req.service_tax > 0:
        service_tax_amount = total_amount * (close_req.service_tax / 100)
        lines.append(f"Taxa de serviço ({close_req.service_tax}%): R$ {service_tax_amount:.2f}")
        total_with_tax = total_amount + service_tax_amount
        lines.append(f"Total: R$ {total_with_tax:.2f}")
    else:
        lines.append(f"Total: R$ {total_amount:.2f}")

    lines.append("=" * 32)
    lines.append("\n")
    print_content = "\n".join(lines)

    # Criar item na fila de impressão
    print_queue_item = PrintQueueCreate(
        type="bill",
        table_id=table_id,
        content=print_content,
    )
    print_queue_crud.create_print_queue_item(db, print_queue_item)

    return {
        "message": "Mesa fechada com sucesso",
        "table_id": table_id,
        "total_amount": total_amount,
        "orders_count": orders_count,
        "orders": orders_data,
        "service_tax": close_req.service_tax,
        "service_tax_amount": total_amount * (close_req.service_tax / 100) if close_req.service_tax > 0 else 0,
        "total_with_tax": total_amount + (total_amount * (close_req.service_tax / 100)) if close_req.service_tax > 0 else total_amount,
        "closed_at": result["closed_at"].isoformat(),
        "closed_by": result["closed_by"],
    }


@router.put(
    "/{table_id}",
    response_model=TableOut,
    status_code=status.HTTP_200_OK,
)
def update_table_endpoint(
    table_id: int,
    table_update: TableUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )

    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
        )

    return table_crud.update_table(db, table, table_update)


# ============================================================================
# ENDPOINTS DE PEDIDOS (ORDERS) - Reorganizados para /tables/{table_id}/orders/
# ============================================================================

@router.post(
    "/{table_id}/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED
)
def create_order(
    table_id: int,
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    # Verificar se o sistema está habilitado para novos pedidos
    if not system_status_crud.is_orders_enabled(db):
        system_status = system_status_crud.get_system_status(db)
        reason = system_status.reason or "Sistema temporariamente indisponível para novos pedidos"
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Novos pedidos estão bloqueados. Motivo: {reason}"
        )
    
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    if table.is_closed is True:
        raise HTTPException(status_code=404, detail="Table is closed")
    new_order = order_crud.create_order(
        db, order, table_id, created_by=current_user.username
    )
    # Gera conteúdo para impressão (layout melhorado)
    lines = [
        f"{table.name.center(32)}",
        "=" * 32,
        f"PEDIDO #{new_order.id}",
        f"Data: {new_order.created_at.strftime('%d/%m/%Y %H:%M')}",
        "-" * 32,
        "Itens:",
    ]
    total = 0
    for item in new_order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        product_name = product.name if product else f"ID {item.product_id}"
        subtotal = item.quantity * item.unit_price
        total += subtotal
        lines.append(
            f"{item.quantity}x {product_name[:20].ljust(20)} R$ {subtotal:6.2f}"
        )
        if item.comment:
            lines.append(f"   Obs: {item.comment}")
    lines.append("-" * 32)
    lines.append(f"Total de itens: {new_order.total_items}")
    lines.append(f"Total: R$ {total:.2f}")
    if new_order.comment:
        lines.append("-" * 32)
        lines.append(f"Obs: {new_order.comment}")
    lines.append("=" * 32)
    lines.append("\n")
    print_content = "\n".join(lines)
    print_queue_item = PrintQueueCreate(
        type="order", order_id=new_order.id, table_id=table_id, content=print_content
    )
    print_queue_crud.create_print_queue_item(db, print_queue_item)
    return new_order


@router.get(
    "/{table_id}/orders", response_model=List[OrderOut], status_code=status.HTTP_200_OK
)
def list_orders(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return order_crud.get_orders_by_table(db, table_id)


@router.get(
    "/{table_id}/orders/{order_id}",
    response_model=OrderOut,
    status_code=status.HTTP_200_OK,
)
def get_order_by_id(
    table_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    order = order_crud.get_order(db, order_id)
    if not order or order.table_id != table_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.delete("/{table_id}/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_order(
    table_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    order = order_crud.get_order(db, order_id)
    if not order or order.table_id != table_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_crud.delete_order(db, order_id)


@router.put(
    "/{table_id}/orders/{order_id}",
    response_model=OrderOut,
    status_code=status.HTTP_200_OK,
)
def update_order(
    table_id: int,
    order_id: int,
    order_update: OrderUpdateWithItems,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    order = order_crud.get_order(db, order_id)
    if not order or order.table_id != table_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verificar permissões baseadas no status do pedido
    if order.status == "finished":
        if current_user.role != "administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify finished orders"
            )
    elif order.status == "cancelled":
        if current_user.role != "administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can modify cancelled orders"
            )
    
    # Administradores podem modificar pedidos em qualquer status
    # e podem cancelar pedidos e modificar itens
    updated_order = order_crud.update_order_with_items(db, order_id, order_update, updated_by=current_user.username)
    
    if not updated_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return updated_order


@router.put(
    "/{table_id}/orders/{order_id}/finish",
    response_model=OrderOut,
    status_code=status.HTTP_200_OK,
)
def finish_order(
    table_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    order = order_crud.get_order(db, order_id)
    if not order or order.table_id != table_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == "finished":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already finished"
        )
    
    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot finish a cancelled order"
        )
    
    # Criar update apenas com status finished
    order_update = OrderUpdate(status="finished")

    # Atualizar o pedido
    updated_order = order_crud.update_order(db, order_id, order_update, updated_by=current_user.username)
    
    if not updated_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return updated_order


@router.put(
    "/{table_id}/orders/{order_id}/cancel",
    response_model=OrderOut,
    status_code=status.HTTP_200_OK,
)
def cancel_order(
    table_id: int,
    order_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    table = table_crud.get_table(db, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    order = order_crud.get_order(db, order_id)
    if not order or order.table_id != table_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled"
        )
    
    if order.status == "finished":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a finished order"
        )
    
    # Criar update apenas com status cancelled
    order_update = OrderUpdate(status="cancelled")

    # Atualizar o pedido
    updated_order = order_crud.update_order(db, order_id, order_update, updated_by=current_user.username)
    
    if not updated_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return updated_order
