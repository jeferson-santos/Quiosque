#!/usr/bin/env python3
"""
Script para executar todos os seeds na ordem correta.

Este script executa todos os scripts de seed necessários para criar
dados de teste completos, incluindo as novas funcionalidades.
"""

import subprocess
import sys
import os

# Scripts na ordem de execução (dependências)
scripts = [
    "seed_rooms.py",                    # 1. Criar quartos
    "seed_tables.py",                   # 2. Criar mesas básicas
    "seed_tables_with_room.py",         # 3. Criar mesas vinculadas a quartos
    "migrate_display_order.py",         # 4. Adicionar display_order às categorias
    "seed_categories.py",               # 5. Criar categorias de produtos
    "seed_products.py",                 # 6. Criar produtos (agora com categorias)
    "seed_orders_with_payments.py",     # 7. Criar pedidos com pagamentos (inclui ROOM_CHARGE)
    "seed_close_tables_with_room_charge.py",  # 8. Fechar mesas com ROOM_CHARGE para teste
]

def run_script(script):
    """Executa um script de seed."""
    print(f"\n{'='*60}")
    print(f"EXECUTANDO: {script}")
    print(f"{'='*60}")
    
    script_path = os.path.join("scripts", script)
    
    if not os.path.exists(script_path):
        print(f"❌ Script não encontrado: {script}")
        return False
    
    result = subprocess.run([sys.executable, script_path], cwd=".")
    
    if result.returncode == 0:
        print(f"✅ {script} executado com sucesso!")
        return True
    else:
        print(f"❌ Erro ao executar {script}")
        return False

def main():
    """Função principal."""
    print("🌱 INICIANDO SEED COMPLETO DO SISTEMA")
    print("="*60)
    
    success_count = 0
    total_scripts = len(scripts)
    
    for i, script in enumerate(scripts, 1):
        print(f"\n[{i}/{total_scripts}] Executando {script}...")
        
        if run_script(script):
            success_count += 1
        else:
            print(f"⚠️  Continuando com os próximos scripts...")
    
    print(f"\n{'='*60}")
    print("RESUMO DA EXECUÇÃO")
    print(f"{'='*60}")
    print(f"Scripts executados com sucesso: {success_count}/{total_scripts}")
    
    if success_count == total_scripts:
        print("🎉 TODOS OS SEEDS EXECUTADOS COM SUCESSO!")
        print("\nDados criados:")
        print("  ✅ Quartos (10 quartos)")
        print("  ✅ Mesas básicas (5 mesas)")
        print("  ✅ Mesas vinculadas a quartos (2 mesas)")
        print("  ✅ Categorias de produtos com ordem de exibição (6 categorias)")
        print("  ✅ Produtos com categorias (40+ produtos)")
        print("  ✅ Pedidos com pagamentos (incluindo ROOM_CHARGE)")
        print("  ✅ Mesas fechadas com ROOM_CHARGE para teste")
        print("\nAgora você pode testar:")
        print("  - Relatórios de consumo do quarto")
        print("  - Endpoints de mesas por quarto")
        print("  - Validação de exclusão de quartos")
        print("  - CRUD de categorias de produtos")
        print("  - Produtos organizados por categoria")
    else:
        print("⚠️  Alguns scripts falharam. Verifique os erros acima.")
    
    print(f"\n{'='*60}")

if __name__ == "__main__":
    main() 