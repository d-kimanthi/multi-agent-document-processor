import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Smart Document Intelligence Platform"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/docplatform"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Vector Database
    VECTOR_DB_TYPE: str = "chroma"  # or "pinecone"
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None

    # NLP Models
    SPACY_MODEL: str = "en_core_web_sm"
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    SUMMARIZATION_MODEL: str = "facebook/bart-large-cnn"

    # Agent Configuration
    AGENT_MAX_RETRIES: int = 3
    AGENT_TIMEOUT: int = 30
    MESSAGE_QUEUE_SIZE: int = 1000

    # File Upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".txt", ".md"}

    # Monitoring
    METRICS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
