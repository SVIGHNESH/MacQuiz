from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str
    CORS_ALLOW_CREDENTIALS: bool = True
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    
    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if self.CORS_ALLOW_CREDENTIALS and "*" in origins:
            # Browsers block '*' with credentials; also unsafe.
            # Force the safer behavior while keeping the app running.
            print("⚠️  CORS_ORIGINS contains '*' while credentials are enabled; disabling credentials")
            self.CORS_ALLOW_CREDENTIALS = False
        return origins
    
    class Config:
        env_file = ".env"

settings = Settings()
