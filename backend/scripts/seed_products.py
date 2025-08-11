import sys
import os
from datetime import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal
from app.schemas.product import ProductCreate
from app.crud.product import create_product
from app.crud.category import get_category_by_name

# Lista de produtos de exemplo
produtos = [
    # Frutos do Mar
    {"name": "Camarão Frito", "description": "Porção de camarão empanado e frito", "price": 49.90, "category": "Frutos do Mar", "stock_quantity": 0},
    {"name": "Lula à Dorê", "description": "Anéis de lula empanados", "price": 44.90, "category": "Frutos do Mar", "stock_quantity": 2},
    {"name": "Isca de Peixe", "description": "Iscas de peixe empanadas", "price": 39.90, "category": "Frutos do Mar", "stock_quantity": 18},
    {"name": "Bolinho de Bacalhau", "description": "Porção com 10 bolinhos", "price": 32.00, "category": "Frutos do Mar", "stock_quantity": 25},
    {"name": "Moqueca de Peixe", "description": "Moqueca de peixe com arroz e pirão", "price": 59.90, "category": "Frutos do Mar", "stock_quantity": 10},
    {"name": "Casquinha de Siri", "description": "Casquinha de siri gratinada", "price": 19.90, "category": "Frutos do Mar", "stock_quantity": 12},
    {"name": "Caranguejo", "description": "Caranguejo inteiro cozido", "price": 24.90, "category": "Frutos do Mar", "stock_quantity": 14},
    # Petiscos
    {"name": "Batata Frita", "description": "Porção de batata frita crocante", "price": 22.00, "category": "Petiscos", "stock_quantity": 30},
    {"name": "Mandioca Frita", "description": "Porção de mandioca frita", "price": 20.00, "category": "Petiscos", "stock_quantity": 25},
    {"name": "Calabresa Acebolada", "description": "Calabresa fatiada com cebola", "price": 27.00, "category": "Petiscos", "stock_quantity": 20},
    {"name": "Frango à Passarinho", "description": "Porção de frango temperado e frito", "price": 29.00, "category": "Petiscos", "stock_quantity": 22},
    {"name": "Queijo Coalho", "description": "Espetinho de queijo coalho grelhado", "price": 12.00, "category": "Petiscos", "stock_quantity": 40},
    {"name": "Pastel de Camarão", "description": "Pastel recheado com camarão", "price": 9.00, "category": "Petiscos", "stock_quantity": 30},
    {"name": "Pastel de Queijo", "description": "Pastel recheado com queijo", "price": 7.00, "category": "Petiscos", "stock_quantity": 30},
    {"name": "Aipim com Carne Seca", "description": "Aipim cozido com carne seca desfiada", "price": 34.00, "category": "Petiscos", "stock_quantity": 15},
    {"name": "Bolinho de Aipim", "description": "Porção com 10 bolinhos", "price": 18.00, "category": "Petiscos", "stock_quantity": 20},
    # Bebidas
    {"name": "Coca-Cola", "description": "Refrigerante Coca-Cola 350ml", "price": 6.00, "category": "Bebidas", "stock_quantity": 50},
    {"name": "Guaraná Antarctica", "description": "Refrigerante Guaraná 350ml", "price": 6.00, "category": "Bebidas", "stock_quantity": 40},
    {"name": "Fanta Laranja", "description": "Refrigerante Fanta Laranja 350ml", "price": 6.00, "category": "Bebidas", "stock_quantity": 40},
    {"name": "Sprite", "description": "Refrigerante Sprite 350ml", "price": 6.00, "category": "Bebidas", "stock_quantity": 30},
    {"name": "Água Mineral", "description": "Água mineral sem gás 500ml", "price": 4.00, "category": "Bebidas", "stock_quantity": 60},
    {"name": "Água de Coco", "description": "Água de coco natural", "price": 8.00, "category": "Bebidas", "stock_quantity": 35},
    {"name": "Suco de Laranja", "description": "Suco natural de laranja", "price": 10.00, "category": "Bebidas", "stock_quantity": 25},
    {"name": "Cerveja Skol", "description": "Cerveja Skol lata 350ml", "price": 7.00, "category": "Bebidas", "stock_quantity": 50},
    {"name": "Cerveja Brahma", "description": "Cerveja Brahma lata 350ml", "price": 7.00, "category": "Bebidas", "stock_quantity": 50},
    {"name": "Cerveja Heineken", "description": "Cerveja Heineken long neck", "price": 12.00, "category": "Bebidas", "stock_quantity": 30},
    {"name": "Caipirinha", "description": "Caipirinha de limão", "price": 15.00, "category": "Bebidas", "stock_quantity": 20},
    # Crepes
    {"name": "Crepe de Frango", "description": "Crepe recheado com frango e queijo", "price": 16.00, "category": "Crepes", "stock_quantity": 20},
    {"name": "Crepe de Presunto e Queijo", "description": "Crepe recheado com presunto e queijo", "price": 15.00, "category": "Crepes", "stock_quantity": 20},
    {"name": "Crepe de Chocolate", "description": "Crepe doce com chocolate", "price": 14.00, "category": "Crepes", "stock_quantity": 15},
    {"name": "Crepe de Banana com Canela", "description": "Crepe doce de banana com canela", "price": 14.00, "category": "Crepes", "stock_quantity": 15},
    # Outros
    {"name": "Espetinho de Carne", "description": "Espetinho de carne bovina grelhada", "price": 13.00, "category": "Outros", "stock_quantity": 25},
    {"name": "Espetinho de Frango", "description": "Espetinho de frango grelhado", "price": 12.00, "category": "Outros", "stock_quantity": 25},
    {"name": "Salada de Frutas", "description": "Salada de frutas frescas", "price": 10.00, "category": "Outros", "stock_quantity": 18},
    {"name": "Sorvete de Coco", "description": "Sorvete artesanal de coco", "price": 8.00, "category": "Outros", "stock_quantity": 20},
    {"name": "Sorvete de Manga", "description": "Sorvete artesanal de manga", "price": 8.00, "category": "Outros", "stock_quantity": 20},
    {"name": "Açaí na Tigela", "description": "Açaí com granola e banana", "price": 15.00, "category": "Outros", "stock_quantity": 15},
    {"name": "Tapioca de Coco", "description": "Tapioca recheada com coco ralado", "price": 10.00, "category": "Outros", "stock_quantity": 15},
    {"name": "Tapioca de Queijo", "description": "Tapioca recheada com queijo", "price": 10.00, "category": "Outros", "stock_quantity": 15},
]

def main():
    db = SessionLocal()
    created_count = 0
    error_count = 0
    
    try:
        print("🌱 Criando produtos com categorias...")
        
        for p in produtos:
            try:
                # Buscar a categoria pelo nome
                category_name = p.get("category", "Outros")
                category = get_category_by_name(db, category_name)
                
                if not category:
                    print(f"  ⚠️  Categoria '{category_name}' não encontrada, usando 'Outros'")
                    category = get_category_by_name(db, "Outros")
                    if not category:
                        print(f"  ❌ Categoria 'Outros' também não encontrada, pulando produto '{p['name']}'")
                        error_count += 1
                        continue
                
                product_data = ProductCreate(
                    name=p["name"],
                    description=p.get("description"),
                    price=p["price"],
                    is_active=True,
                    category_id=category.id,
                    stock_quantity=p.get("stock_quantity", 10),
                    available_from=time(8, 0),
                    available_until=time(22, 0),
                )
                create_product(db, product_data)
                created_count += 1
                print(f"  ✅ Produto '{p['name']}' criado na categoria '{category.name}'")
                
            except Exception as e:
                print(f"  ❌ Erro ao criar produto '{p['name']}': {e}")
                error_count += 1
        
        print(f"\n🎉 {created_count} produtos criados com sucesso!")
        if error_count > 0:
            print(f"⚠️  {error_count} produtos com erro")
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main() 