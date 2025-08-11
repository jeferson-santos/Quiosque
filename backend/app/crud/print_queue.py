"""
CRUD operations para fila de impressão.

Este módulo contém as operações CRUD para a fila de impressão.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.print_queue import PrintQueue, PrintQueueStatus
from app.schemas.print_queue import PrintQueueCreate, PrintQueueUpdate


def create_print_queue_item(
    db: Session, print_queue_data: PrintQueueCreate
) -> PrintQueue:
    """Cria um novo item na fila de impressão."""
    db_print_queue = PrintQueue(
        type=print_queue_data.type,
        order_id=print_queue_data.order_id,
        table_id=print_queue_data.table_id,
        content=print_queue_data.content,
        printer=print_queue_data.printer,
        fiscal=print_queue_data.fiscal or False,
        status=PrintQueueStatus.PENDING,
    )
    db.add(db_print_queue)
    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def get_next_print_queue_item(db: Session) -> Optional[PrintQueue]:
    """Busca o próximo item pendente na fila de impressão."""
    return (
        db.query(PrintQueue)
        .filter(PrintQueue.status == PrintQueueStatus.PENDING)
        .order_by(PrintQueue.created_at.asc())
        .first()
    )


def get_print_queue_item(db: Session, print_queue_id: int) -> Optional[PrintQueue]:
    """Busca um item específico na fila de impressão."""
    return db.query(PrintQueue).filter(PrintQueue.id == print_queue_id).first()


def update_print_queue_item(
    db: Session, print_queue_id: int, print_queue_update: PrintQueueUpdate
) -> Optional[PrintQueue]:
    """Atualiza um item na fila de impressão."""
    db_print_queue = (
        db.query(PrintQueue).filter(PrintQueue.id == print_queue_id).first()
    )
    if not db_print_queue:
        return None

    update_data = print_queue_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_print_queue, key, value)

    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def mark_as_printed(
    db: Session, print_queue_id: int, printer: str = None
) -> Optional[PrintQueue]:
    """Marca um item como impresso."""
    db_print_queue = (
        db.query(PrintQueue).filter(PrintQueue.id == print_queue_id).first()
    )
    if not db_print_queue:
        return None

    db_print_queue.status = PrintQueueStatus.PRINTED
    db_print_queue.printed_at = datetime.utcnow()
    if printer:
        db_print_queue.printer = printer

    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def mark_as_error(
    db: Session, print_queue_id: int, error_message: str
) -> Optional[PrintQueue]:
    """Marca um item como erro na impressão."""
    db_print_queue = (
        db.query(PrintQueue).filter(PrintQueue.id == print_queue_id).first()
    )
    if not db_print_queue:
        return None

    db_print_queue.status = PrintQueueStatus.ERROR
    db_print_queue.error_message = error_message
    db_print_queue.retry_count += 1

    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def delete_print_queue_item(db: Session, print_queue_id: int) -> bool:
    """Remove um item da fila de impressão."""
    db_print_queue = (
        db.query(PrintQueue).filter(PrintQueue.id == print_queue_id).first()
    )
    if not db_print_queue:
        return False

    db.delete(db_print_queue)
    db.commit()
    return True


def get_pending_print_queue_count(db: Session) -> int:
    """Retorna o número de itens pendentes na fila de impressão."""
    return (
        db.query(PrintQueue)
        .filter(PrintQueue.status == PrintQueueStatus.PENDING)
        .count()
    )


def get_all_print_queue_items(
    db: Session, status: str = None, print_type: str = None, limit: int = 100
) -> List[PrintQueue]:
    """Busca todos os itens da fila de impressão com filtros opcionais."""
    query = db.query(PrintQueue)

    # Aplicar filtros se fornecidos
    if status:
        query = query.filter(PrintQueue.status == status)
    if print_type:
        query = query.filter(PrintQueue.type == print_type)

    # Ordenar por data de criação (mais recentes primeiro) e limitar
    return query.order_by(PrintQueue.created_at.desc()).limit(limit).all()


def create_room_consumption_report_print_item(
    db: Session, room_id: int, date: str, report_data: dict
) -> PrintQueue:
    """Cria um item na fila de impressão para relatório de consumo do quarto."""
    
    # Formatar o conteúdo para impressão
    content = format_room_consumption_report_for_print(report_data)
    
    # Buscar uma mesa associada ao quarto para usar como table_id
    from app.models.table import Table
    table = db.query(Table).filter(Table.room_id == room_id).first()
    
    if not table:
        raise ValueError(f"Nenhuma mesa encontrada para o quarto {room_id}")
    
    db_print_queue = PrintQueue(
        type="room_consumption_report",
        order_id=None,  # Não é um pedido específico
        table_id=table.id,
        content=content,
        printer=None,  # Usar impressora padrão
        fiscal=False,  # Não é nota fiscal
        status=PrintQueueStatus.PENDING,
    )
    
    db.add(db_print_queue)
    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def format_room_consumption_report_for_print(report_data: dict) -> str:
    """Formata o relatório de consumo do quarto para impressão."""
    
    content = []
    content.append("=" * 60)
    content.append("CONSUMO DO QUARTO")
    content.append("=" * 60)
    content.append(f"QUARTO: {report_data['room_number']}")
    content.append(f"HÓSPEDE: {report_data['guest_name'] or 'NÃO INFORMADO'}")
    content.append(f"DATA: {report_data['date']}")
    content.append(f"HORA: {datetime.now().strftime('%H:%M:%S')}")
    content.append("")
    
    # Detalhamento por mesa
    if report_data['tables_consumption']:
        content.append("DETALHAMENTO POR MESA:")
        content.append("-" * 40)
        for table in report_data['tables_consumption']:
            content.append(f"MESA: {table['name']}")
            content.append(f"  Pedidos: {table['orders_count']}")
            content.append(f"  Itens: {table['total_items']}")
            content.append(f"  Valor: R$ {table['revenue']:.2f}")
            content.append(f"  Fechada em: {table['closed_at']}")
            content.append("")
    
    # Detalhamento por produto em formato de tabela
    if report_data['products_consumption']:
        content.append("DETALHAMENTO POR PRODUTO:")
        content.append("-" * 60)
        content.append(f"{'QTD':<4} {'ITEM':<30} {'VALOR':<8} {'TOTAL':<10}")
        content.append("-" * 60)
        
        for product in report_data['products_consumption']:
            # Truncar nome do produto se muito longo
            item_name = product['name'][:28] + ".." if len(product['name']) > 30 else product['name']
            content.append(f"{product['quantity']:<4} {item_name:<30} {product['unit_price']:<8.2f} {product['total_amount']:<10.2f}")
        
        content.append("-" * 60)
        content.append("")
    
    # Informações técnicas
    content.append("INFORMAÇÕES TÉCNICAS:")
    content.append("-" * 40)
    content.append(f"Quarto ID: {report_data['room_id']}")
    content.append(f"Data de referência: {report_data['date']}")
    content.append(f"Total de mesas fechadas: {report_data['total_tables']}")
    content.append(f"Status dos pedidos: {report_data['orders_by_status']}")
    content.append("")
    
    # Código de barras ou identificador único
    content.append("IDENTIFICADOR ÚNICO:")
    content.append(f"ROOM_{report_data['room_id']}_{report_data['date'].replace('-', '')}")
    content.append("")
    
    # VALOR TOTAL NO FINAL
    content.append("=" * 60)
    content.append("VALOR TOTAL A COBRAR:")
    content.append(f"R$ {report_data['total_revenue_with_tax']:.2f}")
    content.append("=" * 60)
    content.append("FIM DO RELATÓRIO")
    content.append("=" * 60)
    
    return "\n".join(content)
