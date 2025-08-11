"""
Modelos para relatórios e analytics.

Este módulo contém os modelos SQLAlchemy para suporte aos relatórios.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Float, Integer, String, func
from sqlalchemy.ext.declarative import declared_attr

from app.db import Base


class ReportType(str, Enum):
    """Tipos de relatório disponíveis."""

    DAILY_SALES = "daily_sales"
    TOP_PRODUCTS = "top_products"
    WAITER_COMMISSION = "waiter_commission"
    WAITER_COMMISSION_PERIOD = "waiter_commission_period"
    PAYMENT_METHODS = "payment_methods"
    TABLE_PERFORMANCE = "table_performance"
    HOURLY_SALES = "hourly_sales"
    USER_SALES = "user_sales"


class Report(Base):
    """Modelo para armazenar relatórios gerados."""

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generated_by = Column(String, nullable=False)
    parameters = Column(String, nullable=True)  # JSON string com parâmetros
    data = Column(String, nullable=True)  # JSON string com dados do relatório
