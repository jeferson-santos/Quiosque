import uvicorn
from app.core.config import Settings

def main():
    settings = Settings()
    
    print("🚀 Iniciando servidor FastAPI em modo desenvolvimento...")
    print(f"📡 Host: 0.0.0.0 (aceita conexões externas)")
    print(f"🔌 Porta: {settings.PORT}")
    print(f"🌐 URLs disponíveis:")
    print(f"   - Local: http://127.0.0.1:{settings.PORT}")
    print(f"   - Rede: http://192.168.68.102:{settings.PORT}")
    print(f"📊 Health check: http://127.0.0.1:{settings.PORT}/health")
    print("=" * 50)
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0",  # Aceita conexões de qualquer IP
        port=settings.PORT,
        reload=True,  # Auto-reload em desenvolvimento
        log_level="info"
    )

if __name__ == "__main__":
    main()
