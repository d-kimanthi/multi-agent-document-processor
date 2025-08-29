# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    JSON,
    Float,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config import settings
import asyncio

# Convert sync database URL to async
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=settings.DEBUG)
SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    processed_date = Column(DateTime, nullable=True)
    status = Column(
        String, default="uploaded"
    )  # uploaded, processing, completed, error

    # Relationships
    analysis_results = relationship("AnalysisResult", back_populates="document")
    embeddings = relationship("DocumentEmbedding", back_populates="document")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    analysis_type = Column(String, nullable=False)  # ner, sentiment, topics, summary
    result_data = Column(JSON)
    confidence_score = Column(Float, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    agent_id = Column(String)  # Which agent produced this result

    # Relationships
    document = relationship("Document", back_populates="analysis_results")


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_index = Column(Integer)
    text_content = Column(Text)
    embedding_model = Column(String)
    vector_id = Column(String)  # ID in vector database
    created_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="embeddings")


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String, unique=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"))
    status = Column(String, default="pending")  # pending, processing, completed, failed
    current_step = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    step_results = Column(JSON, default={})


class AgentMetrics(Base):
    __tablename__ = "agent_metrics"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, nullable=False)
    agent_type = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    messages_processed = Column(Integer, default=0)
    processing_time = Column(Float, default=0.0)
    error_count = Column(Integer, default=0)
    status = Column(String)


# Database utility functions
async def get_db():
    """Dependency to get database session"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized")


async def close_db():
    """Close database connections"""
    await engine.dispose()


# app/models/document.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"


class DocumentCreate(BaseModel):
    filename: str
    file_path: str
    file_size: int
    mime_type: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    upload_date: datetime
    processed_date: Optional[datetime]
    status: DocumentStatus

    class Config:
        from_attributes = True


class DocumentAnalysis(BaseModel):
    document_id: int
    entities: List[Dict[str, Any]]
    sentiment: Dict[str, float]
    topics: List[Dict[str, Any]]
    summary: str
    confidence_scores: Dict[str, float]


# app/models/analysis.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class NamedEntity(BaseModel):
    text: str
    label: str
    start: int
    end: int
    confidence: float


class SentimentResult(BaseModel):
    label: str  # positive, negative, neutral
    score: float
    confidence: float


class TopicResult(BaseModel):
    topic_id: int
    topic_words: List[str]
    topic_weight: float
    document_probability: float


class AnalysisResultCreate(BaseModel):
    document_id: int
    analysis_type: str
    result_data: Dict[str, Any]
    confidence_score: Optional[float]
    agent_id: str


class AnalysisResultResponse(BaseModel):
    id: int
    document_id: int
    analysis_type: str
    result_data: Dict[str, Any]
    confidence_score: Optional[float]
    created_date: datetime
    agent_id: str

    class Config:
        from_attributes = True


# app/models/agent.py
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime
from app.agents.base_agent import AgentStatus, MessageType


class AgentStatusResponse(BaseModel):
    agent_id: str
    agent_type: str
    status: AgentStatus
    metrics: Dict[str, Any]
    queue_size: int


class MessageResponse(BaseModel):
    id: str
    from_agent: str
    to_agent: str
    message_type: MessageType
    timestamp: datetime
    correlation_id: Optional[str]


class WorkflowStatusResponse(BaseModel):
    workflow_id: str
    document_id: str
    status: str
    current_step: str
    results: Dict[str, Any]
    error_messages: List[Dict[str, Any]]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class SystemStatusResponse(BaseModel):
    system_status: str
    agents: Dict[str, AgentStatusResponse]
    active_workflows: int
    message_history_size: int
    database_connected: bool
    vector_store_connected: bool
