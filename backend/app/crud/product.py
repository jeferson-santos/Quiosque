# app/crud/product.py
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.crud.category import get_category


def create_product(db: Session, product_data: ProductCreate) -> Product:
    # Verificar se a categoria existe
    category = get_category(db, product_data.category_id)
    if not category:
        raise ValueError(f"Categoria com ID {product_data.category_id} não encontrada")
    
    if not category.is_active:
        raise ValueError(f"Categoria '{category.name}' está inativa")
    
    product_dict = product_data.model_dump()
    # Convert HttpUrl to string for database storage
    if product_dict.get("image_url"):
        product_dict["image_url"] = str(product_dict["image_url"])

    product = Product(**product_dict)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_product(db: Session, product_id: int) -> Product | None:
    return db.query(Product).filter(Product.id == product_id).first()


def get_all_products(db: Session, is_active: bool | None = None, category_id: int | None = None) -> list[Product]:
    """Busca produtos com suas categorias relacionadas."""
    query = db.query(Product).options(joinedload(Product.category_rel))
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    return query.all()


def update_product(db: Session, product: Product, updates: ProductUpdate) -> Product:
    update_data = updates.model_dump(exclude_unset=True)
    
    # Verificar se está tentando atualizar a categoria
    if "category_id" in update_data:
        category = get_category(db, update_data["category_id"])
        if not category:
            raise ValueError(f"Categoria com ID {update_data['category_id']} não encontrada")
        
        if not category.is_active:
            raise ValueError(f"Categoria '{category.name}' está inativa")
    
    for field, value in update_data.items():
        if field == "image_url" and value is not None:
            value = str(value)
        setattr(product, field, value)
    
    # Se o estoque foi atualizado e ficou maior que zero, reativa o produto
    if (
        hasattr(product, "stock_quantity")
        and product.stock_quantity is not None
        and product.stock_quantity > 0
    ):
        product.is_active = True
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()


def get_product_with_category(db: Session, product_id: int) -> Product | None:
    """Busca um produto com informações da sua categoria."""
    return db.query(Product).options(joinedload(Product.category_rel)).filter(Product.id == product_id).first()


def increase_stock(db: Session, product: Product, quantity: int) -> Product:
    if quantity < 0:
        raise ValueError("Quantidade deve ser positiva para aumentar o estoque.")
    product.stock_quantity = (product.stock_quantity or 0) + quantity
    if product.stock_quantity > 0:
        product.is_active = True
    db.commit()
    db.refresh(product)
    return product


def decrease_stock(db: Session, product: Product, quantity: int) -> Product:
    if quantity < 0:
        raise ValueError("Quantidade deve ser positiva para diminuir o estoque.")
    if (product.stock_quantity or 0) < quantity:
        raise ValueError("Estoque insuficiente para a operação.")
    product.stock_quantity -= quantity
    if product.stock_quantity == 0:
        product.is_active = False
    db.commit()
    db.refresh(product)
    return product
