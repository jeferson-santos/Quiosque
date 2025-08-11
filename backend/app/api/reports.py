"""
API de relatórios.

Este módulo contém os endpoints para geração de relatórios e analytics.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import report as report_crud
from app.dependencies import get_current_user, get_db
from app.models.room import Room
from app.schemas.auth import TokenData
from app.schemas.report import (
    DailySalesReport,
    HourlySalesReport,
    PaymentMethodsReport,
    ReportRequest,
    TablePerformanceReport,
    TopProductsReport,
    UserSalesReport,
    WaiterCommissionReport,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily-sales/{date}", response_model=DailySalesReport)
def get_daily_sales_report(
    date: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de vendas diárias."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_daily_sales_report(db, date)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/top-products", response_model=TopProductsReport)
def get_top_products_report(
    limit: int = Query(10, ge=1, le=100, description="Quantidade de produtos"),
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de produtos mais vendidos."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_top_products_report(db, limit, days)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/waiter-commission", response_model=WaiterCommissionReport)
def get_waiter_commission_report(
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de comissão de garçons."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_waiter_commission_report(db, start_date, end_date)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payment-methods", response_model=PaymentMethodsReport)
def get_payment_methods_report(
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de métodos de pagamento."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_payment_methods_report(db, days)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/table-performance", response_model=TablePerformanceReport)
def get_table_performance_report(
    days: int = Query(30, ge=1, le=365, description="Período em dias"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de performance das mesas."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_table_performance_report(db, days)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/hourly-sales/{date}", response_model=HourlySalesReport)
def get_hourly_sales_report(
    date: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de vendas por hora."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_hourly_sales_report(db, date)
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user-sales/{username}", response_model=UserSalesReport)
def get_user_sales_report(
    username: str,
    start_date: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Gera relatório de vendas de um usuário específico."""

    # Apenas administradores podem gerar relatórios
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=403, detail="Only administrators can generate reports"
        )

    try:
        report_data = report_crud.get_user_sales_report(
            db, username, start_date, end_date
        )
        return report_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
