"""
CRUD operations para configuração de filas de impressão.

Este módulo contém as operações CRUD para configuração de filas de impressão.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.print_queue_config import PrintQueueConfig
from app.schemas.print_queue_config import PrintQueueConfigCreate, PrintQueueConfigUpdate


def create_print_queue_config(db: Session, print_queue_data: PrintQueueConfigCreate) -> PrintQueueConfig:
    """Cria uma nova configuração de fila de impressão."""
    # Se esta fila será padrão, remover o padrão das outras
    if print_queue_data.is_default:
        db.query(PrintQueueConfig).filter(PrintQueueConfig.is_default == True).update({"is_default": False})
    
    db_print_queue = PrintQueueConfig(**print_queue_data.model_dump())
    db.add(db_print_queue)
    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def get_print_queue_config(db: Session, print_queue_id: int) -> Optional[PrintQueueConfig]:
    """Busca uma configuração de fila de impressão pelo ID."""
    return db.query(PrintQueueConfig).filter(PrintQueueConfig.id == print_queue_id).first()


def get_default_print_queue_config(db: Session) -> Optional[PrintQueueConfig]:
    """Busca a fila de impressão padrão."""
    return db.query(PrintQueueConfig).filter(PrintQueueConfig.is_default == True).first()


def get_all_print_queue_configs(db: Session) -> List[PrintQueueConfig]:
    """Busca todas as configurações de fila de impressão."""
    return db.query(PrintQueueConfig).order_by(PrintQueueConfig.name).all()


def update_print_queue_config(
    db: Session, 
    print_queue_id: int, 
    print_queue_update: PrintQueueConfigUpdate
) -> Optional[PrintQueueConfig]:
    """Atualiza uma configuração de fila de impressão."""
    db_print_queue = get_print_queue_config(db, print_queue_id)
    if not db_print_queue:
        return None

    update_data = print_queue_update.model_dump(exclude_unset=True)
    
    # Se está definindo como padrão, remover o padrão das outras
    if update_data.get("is_default") == True:
        db.query(PrintQueueConfig).filter(
            PrintQueueConfig.is_default == True,
            PrintQueueConfig.id != print_queue_id
        ).update({"is_default": False})
    
    for key, value in update_data.items():
        setattr(db_print_queue, key, value)

    db.commit()
    db.refresh(db_print_queue)
    return db_print_queue


def delete_print_queue_config(db: Session, print_queue_id: int) -> bool:
    """Remove uma configuração de fila de impressão."""
    db_print_queue = get_print_queue_config(db, print_queue_id)
    if not db_print_queue:
        return False

    # Se é a única fila padrão, não permitir exclusão
    if db_print_queue.is_default:
        total_queues = db.query(PrintQueueConfig).count()
        if total_queues == 1:
            raise ValueError("Não é possível excluir a única fila de impressão padrão")
    
    # Se é padrão mas há outras filas, definir a primeira como padrão
    if db_print_queue.is_default:
        other_queue = db.query(PrintQueueConfig).filter(
            PrintQueueConfig.id != print_queue_id
        ).first()
        if other_queue:
            other_queue.is_default = True
            db.commit()

    db.delete(db_print_queue)
    db.commit()
    return True


def ensure_default_queue_exists(db: Session) -> PrintQueueConfig:
    """Garante que sempre existe uma fila padrão."""
    default_queue = get_default_print_queue_config(db)
    if not default_queue:
        # Se não há fila padrão, criar uma ou definir a primeira como padrão
        first_queue = db.query(PrintQueueConfig).first()
        if first_queue:
            first_queue.is_default = True
            db.commit()
            return first_queue
        else:
            # Criar uma fila padrão se não existir nenhuma
            default_queue = PrintQueueConfig(
                name="Fila Padrão",
                description="Fila de impressão padrão do sistema",
                is_default=True
            )
            db.add(default_queue)
            db.commit()
            db.refresh(default_queue)
            return default_queue
    return default_queue 