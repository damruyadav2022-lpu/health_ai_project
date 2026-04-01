from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "HealthAI Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-secret-key-in-production-32chars!!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./healthai.db"

    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://localhost:3000,https://healthai-production.up.railway.app"
    )

    TESSERACT_CMD: str = "tesseract"
    RATE_LIMIT: str = "100/minute"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
