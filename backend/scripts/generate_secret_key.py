#!/usr/bin/env python3
"""
Script para gerar uma SECRET_KEY aleatória para uso em aplicações FastAPI.
Gera uma chave segura usando o módulo secrets do Python.
"""

import secrets
import base64
import argparse
from typing import Optional


def generate_secret_key(length: int = 32) -> str:
    """
    Gera uma SECRET_KEY aleatória usando o módulo secrets.
    
    Args:
        length: Comprimento da chave em bytes (padrão: 32)
    
    Returns:
        String com a chave codificada em base64
    """
    # Gera bytes aleatórios seguros
    random_bytes = secrets.token_bytes(length)
    
    # Codifica em base64 para uma string legível
    secret_key = base64.b64encode(random_bytes).decode('utf-8')
    
    return secret_key


def generate_hex_secret_key(length: int = 32) -> str:
    """
    Gera uma SECRET_KEY aleatória em formato hexadecimal.
    
    Args:
        length: Comprimento da chave em bytes (padrão: 32)
    
    Returns:
        String hexadecimal da chave
    """
    random_bytes = secrets.token_bytes(length)
    secret_key = random_bytes.hex()
    
    return secret_key


def main():
    parser = argparse.ArgumentParser(
        description="Gera uma SECRET_KEY aleatória para aplicações FastAPI"
    )
    parser.add_argument(
        "--length", 
        type=int, 
        default=32,
        help="Comprimento da chave em bytes (padrão: 32)"
    )
    parser.add_argument(
        "--format", 
        choices=["base64", "hex"], 
        default="base64",
        help="Formato da chave (padrão: base64)"
    )
    parser.add_argument(
        "--env-file", 
        action="store_true",
        help="Gera a saída no formato para arquivo .env"
    )
    
    args = parser.parse_args()
    
    if args.format == "base64":
        secret_key = generate_secret_key(args.length)
    else:
        secret_key = generate_hex_secret_key(args.length)
    
    if args.env_file:
        print(f"SECRET_KEY={secret_key}")
    else:
        print("=== SECRET_KEY Gerada ===")
        print(f"Formato: {args.format}")
        print(f"Comprimento: {args.length} bytes")
        print(f"Chave: {secret_key}")
        print("\nPara usar em um arquivo .env:")
        print(f"SECRET_KEY={secret_key}")


if __name__ == "__main__":
    main() 