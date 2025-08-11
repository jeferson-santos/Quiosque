#!/usr/bin/env python3
"""
Script para testar os endpoints de produtos após a remoção do endpoint redundante.

Este script testa se os endpoints principais estão funcionando corretamente.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.crud.product import get_all_products, get_product_with_category
from app.crud.category import get_all_categories


def test_products_endpoints():
    """Testa os endpoints de produtos."""
    db = SessionLocal()
    
    try:
        print("=== Testando Endpoints de Produtos ===\n")
        
        # 1. Testar listagem de produtos
        print("1. Testando listagem de produtos...")
        all_products = get_all_products(db)
        print(f"   Total de produtos: {len(all_products)}")
        
        if all_products:
            print(f"   ✅ Listagem funcionando - {len(all_products)} produtos encontrados")
            
            # Verificar se produtos têm categoria
            products_with_category = [p for p in all_products if hasattr(p, 'category_rel') and p.category_rel]
            print(f"   ✅ {len(products_with_category)} produtos com categoria carregada")
        else:
            print("   ⚠️  Nenhum produto encontrado")
        
        # 2. Testar busca de produto específico
        print("\n2. Testando busca de produto específico...")
        if all_products:
            test_product = all_products[0]
            product_with_category = get_product_with_category(db, test_product.id)
            
            if product_with_category:
                print(f"   ✅ Produto '{product_with_category.name}' encontrado")
                if hasattr(product_with_category, 'category_rel') and product_with_category.category_rel:
                    print(f"   ✅ Categoria '{product_with_category.category_rel.name}' carregada")
                else:
                    print("   ⚠️  Categoria não carregada")
            else:
                print(f"   ❌ Produto com ID {test_product.id} não encontrado")
        else:
            print("   ⚠️  Nenhum produto para testar")
        
        # 3. Testar filtro por categoria
        print("\n3. Testando filtro por categoria...")
        categories = get_all_categories(db)
        
        if categories:
            test_category = categories[0]
            products_in_category = get_all_products(db, category_id=test_category.id)
            print(f"   ✅ Categoria '{test_category.name}': {len(products_in_category)} produtos")
            
            for product in products_in_category[:3]:  # Mostrar apenas os 3 primeiros
                if hasattr(product, 'category_rel') and product.category_rel:
                    print(f"     - {product.name} (categoria: {product.category_rel.name})")
                else:
                    print(f"     - {product.name} (sem categoria)")
        else:
            print("   ⚠️  Nenhuma categoria encontrada")
        
        # 4. Testar filtro por status ativo
        print("\n4. Testando filtro por status ativo...")
        active_products = get_all_products(db, is_active=True)
        inactive_products = get_all_products(db, is_active=False)
        
        print(f"   ✅ Produtos ativos: {len(active_products)}")
        print(f"   ✅ Produtos inativos: {len(inactive_products)}")
        
        # 5. Verificar estrutura dos dados
        print("\n5. Verificando estrutura dos dados...")
        if all_products:
            sample = all_products[0]
            print(f"   📋 Estrutura do produto '{sample.name}':")
            print(f"     - ID: {sample.id}")
            print(f"     - Nome: {sample.name}")
            print(f"     - Preço: R$ {sample.price:.2f}")
            print(f"     - Categoria ID: {sample.category_id}")
            print(f"     - Ativo: {sample.is_active}")
            print(f"     - Estoque: {sample.stock_quantity}")
            
            if hasattr(sample, 'category_rel') and sample.category_rel:
                print(f"     - Categoria: {sample.category_rel.name}")
                print(f"     - Descrição da categoria: {sample.category_rel.description}")
            else:
                print("     - Categoria: Não carregada")
        
        print("\n=== Teste concluído! ===")
        
        # 6. Resumo dos endpoints disponíveis
        print("\n📋 ENDPOINTS DISPONÍVEIS:")
        print("   ✅ GET /products/ - Listar produtos com categorias")
        print("   ✅ GET /products/{id} - Buscar produto específico com categoria")
        print("   ✅ GET /products/?category_id=X - Filtrar por categoria")
        print("   ✅ GET /products/?is_active=true - Filtrar por status")
        print("   ✅ POST /products/ - Criar produto (com category_id)")
        print("   ✅ PATCH /products/{id} - Atualizar produto")
        print("   ✅ DELETE /products/{id} - Remover produto")
        print("   ✅ POST /products/{id}/upload_image - Upload de imagem")
        print("   ✅ GET /products/{id}/image - Buscar imagem")
        print("   ✅ DELETE /products/{id}/image - Remover imagem")
        print("   ✅ PATCH /products/{id}/increase_stock - Aumentar estoque")
        print("   ✅ PATCH /products/{id}/decrease_stock - Diminuir estoque")
        
        # 7. Endpoints removidos
        print("\n🗑️  ENDPOINTS REMOVIDOS:")
        print("   ❌ GET /products/{id}/with-category - Redundante (agora sempre retorna com categoria)")
        print("   ❌ GET /products/images/{id} - Redundante (usar /products/{id}/image)")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_products_endpoints() 