"""
Schemas de relatórios.

Este módulo contém os schemas Pydantic para relatórios e analytics.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.report import ReportType


class DailySalesReport(BaseModel):
    """Schema para relatório de vendas diárias."""

    date: str
    total_orders: int
    total_revenue: float
    total_revenue_with_tax: float
    total_service_tax: float
    average_order_value: float
    orders_by_status: dict
    payment_methods_summary: dict
    top_products: List[dict]

    model_config = ConfigDict(from_attributes=True)


class TopProductsReport(BaseModel):
    """Schema para relatório de produtos mais vendidos."""

    period: str
    limit: int
    products: List[dict]
    total_quantity_sold: int
    total_revenue_from_products: float

    model_config = ConfigDict(from_attributes=True)


class WaiterCommissionReport(BaseModel):
    """Schema para relatório de comissão de garçons."""

    period: str
    total_commission: float
    commission_rate: float  # 10% por padrão
    waiters: List[dict]
    total_orders: int
    total_revenue: float

    model_config = ConfigDict(from_attributes=True)


class PaymentMethodsReport(BaseModel):
    """Schema para relatório de métodos de pagamento."""

    period: str
    total_transactions: int
    total_revenue: float
    methods: List[dict]

    model_config = ConfigDict(from_attributes=True)


class TablePerformanceReport(BaseModel):
    """Schema para relatório de performance das mesas."""

    period: str
    total_tables: int
    active_tables: int
    closed_tables: int
    average_orders_per_table: float
    average_revenue_per_table: float
    tables: List[dict]

    model_config = ConfigDict(from_attributes=True)


class HourlySalesReport(BaseModel):
    """Schema para relatório de vendas por hora."""

    date: str
    total_revenue: float
    total_orders: int
    hourly_data: List[dict]
    peak_hours: List[str]

    model_config = ConfigDict(from_attributes=True)


class UserSalesReport(BaseModel):
    """Schema para relatório de vendas por usuário."""

    period: str
    username: str
    user_role: str
    total_tables_created: int
    active_tables: int
    closed_tables: int
    total_orders: int
    total_revenue: float
    total_revenue_with_tax: float
    total_service_tax: float
    average_order_value: float
    orders_by_status: dict
    payment_methods_summary: dict
    top_products_sold: List[dict]

    model_config = ConfigDict(from_attributes=True)


class ReportRequest(BaseModel):
    """Schema para requisição de relatório."""

    report_type: ReportType
    date: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = None
    waiter_id: Optional[int] = None


class RoomConsumptionReport(BaseModel):
    """Schema para relatório de consumo de quarto."""
    
    room_id: int
    room_number: str
    guest_name: Optional[str] = None
    date: str
    total_tables: int
    total_orders: int
    total_items: int
    total_revenue: float
    total_revenue_with_tax: float
    total_service_tax: float
    average_order_value: float
    orders_by_status: Dict[str, int]
    products_consumption: List[Dict[str, Any]]
    tables_consumption: List[Dict[str, Any]]
    include_all_tables: bool = False
