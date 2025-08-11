from datetime import timedelta

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    # Configuração simplificada para rede interna apenas
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    CLIENT_ID: str = ""
    CLIENT_SECRET: str = ""
    CLIENT_ROLE: str = "client"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    @property
    def access_token_expiration(self) -> timedelta:
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)

    @property
    def cors_origins_list(self) -> list[str]:
        """Converte a string de CORS_ORIGINS em uma lista e adiciona toda a rede 192.168.*"""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
        # Adicionar toda a rede 192.168.* para acesso interno
        network_192_168 = [
            f"http://192.168.{i}.0/24" for i in range(256)
        ]
        origins.extend(network_192_168)
        
        return origins

    model_config = ConfigDict(env_file=".env")
