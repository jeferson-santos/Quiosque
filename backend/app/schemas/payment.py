"""
Schemas de pagamento.

Este módulo contém os schemas Pydantic para validação de dados de pagamento.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentBase(BaseModel):
    method: PaymentMethod
    amount_paid: float = Field(..., gt=0, description="Valor pago pelo cliente")
    service_tax_included: str = Field(default="no", pattern="^(yes|no)$")
    change: float = Field(default=0.0, ge=0)


class PaymentCreate(PaymentBase):
    """Schema para criação de pagamento."""

    pass


class PaymentUpdate(BaseModel):
    """Schema para atualização de pagamento."""

    status: Optional[PaymentStatus] = None
    amount_paid: Optional[float] = Field(None, gt=0)
    change: Optional[float] = Field(None, ge=0)


class PaymentOut(PaymentBase):
    """Schema para resposta de pagamento."""

    id: int
    order_id: int
    status: PaymentStatus
    amount: float
    service_tax: float
    created_at: datetime
    paid_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentSummary(BaseModel):
    """Schema para resumo de pagamento."""

    order_id: int
    total_amount: float
    total_with_tax: float
    amount_paid: float
    change: float
    method: PaymentMethod
    status: PaymentStatus
    service_tax_included: bool

    model_config = ConfigDict(from_attributes=True)
