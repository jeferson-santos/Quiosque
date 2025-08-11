from sqlalchemy.orm import Session

from app.models.system_status import SystemStatus
from app.schemas.system_status import SystemStatusUpdate


def get_system_status(db: Session) -> SystemStatus:
    """Busca o status atual do sistema."""
    status = db.query(SystemStatus).first()
    
    if not status:
        # Criar status padrão se não existir
        status = SystemStatus(orders_enabled=True)
        db.add(status)
        db.commit()
        db.refresh(status)
    
    return status


def update_system_status(db: Session, updates: SystemStatusUpdate, updated_by: str) -> SystemStatus:
    """Atualiza o status do sistema."""
    status = get_system_status(db)
    
    status.orders_enabled = updates.orders_enabled
    status.reason = updates.reason
    status.updated_by = updated_by
    
    db.commit()
    db.refresh(status)
    return status


def is_orders_enabled(db: Session) -> bool:
    """Verifica se os pedidos estão habilitados."""
    status = get_system_status(db)
    return status.orders_enabled 