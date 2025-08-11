# app/crud/category.py
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def create_category(db: Session, category_data: CategoryCreate) -> Category:
    """Cria uma nova categoria."""
    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category(db: Session, category_id: int) -> Category | None:
    """Busca uma categoria pelo ID."""
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_name(db: Session, name: str) -> Category | None:
    """Busca uma categoria pelo nome."""
    return db.query(Category).filter(Category.name == name).first()


def get_all_categories(db: Session, is_active: bool | None = None) -> list[Category]:
    """Busca todas as categorias, opcionalmente filtradas por status ativo."""
    query = db.query(Category)
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)
    return query.order_by(Category.display_order, Category.name).all()


def update_category(db: Session, category: Category, updates: CategoryUpdate) -> Category:
    """Atualiza uma categoria existente."""
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category) -> None:
    """Remove uma categoria."""
    db.delete(category)
    db.commit()


def get_category_with_products(db: Session, category_id: int) -> Category | None:
    """Busca uma categoria com seus produtos relacionados."""
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_with_print_queue(db: Session, category_id: int) -> Category | None:
    """Busca uma categoria com sua fila de impressão relacionada."""
    return db.query(Category).filter(Category.id == category_id).first() 