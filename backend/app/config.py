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
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )

    TESSERACT_CMD: str = "tesseract"
    RATE_LIMIT: str = "100/minute"
    ANTHROPIC_API_KEY: str = "sk-REPLACE_WITH_YOUR_ANTHROPIC_KEY"
    ANTHROPIC_ADMIN_API_KEY: str = "" # Required for organizational key management

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()
