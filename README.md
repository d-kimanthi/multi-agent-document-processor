# Smart Document Intelligence Platform

A comprehensive multi-agent system for document processing, analysis, and intelligent querying using advanced NLP techniques.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture Design](#architecture-design)
- [Quick Setup](#quick-setup)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [System Requirements](#system-requirements)
- [Configuration Guide](#configuration-guide)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

The Smart Document Intelligence Platform is a **production-ready, multi-agent system** designed to showcase advanced AI engineering capabilities. It combines sophisticated backend processing with a modern frontend interface to create an intelligent document analysis platform.

### Key Capabilities

- **Multi-Agent Architecture**: Coordinated agents handle different aspects of document processing
- **Advanced NLP**: Named entity recognition, sentiment analysis, topic modeling, summarization
- **Vector Search**: Semantic document search and intelligent Q&A using RAG
- **Real-time Monitoring**: Agent communication tracking and performance metrics
- **Modern UI**: Responsive React frontend with real-time updates

### Technology Stack

```
Frontend:  React 18 + TypeScript + Tailwind CSS + Vite
Backend:   FastAPI + SQLAlchemy + AsyncPG + Redis
NLP:       spaCy + Transformers + Sentence-Transformers + scikit-learn
Vector DB: ChromaDB for semantic search
Database:  PostgreSQL for structured data
Agents:    Custom async agent framework with message bus
Deploy:    Docker + Docker Compose
```

---

## Architecture Design

### System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   FastAPI       │◄──►│   PostgreSQL    │
│   (Port 3000)   │    │   Backend       │    │   Database      │
└─────────────────┘    │   (Port 8000)   │    │   (Port 5432)   │
                       └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌─────────────┐    ┌─────────────────┐
            │  ChromaDB   │    │   Multi-Agent   │
            │ Vector Store│    │    System       │
            │ (Port 8001) │    │                 │
            └─────────────┘    └─────────────────┘
                                       │
        ┌──────────────┬───────────────┼────────────────┬──────────────┐
        │              │               │                │              │
┌───────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Orchestrator│ │  Curator    │ │  Analyzer   │ │ Summarizer  │ │   Query     │
│   Agent    │ │   Agent     │ │   Agent     │ │   Agent     │ │   Agent     │
└───────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Multi-Agent Workflow

```
Document Upload → Orchestrator → Curator → Analyzer → Summarizer → Query Agent
                      ↓             ↓          ↓           ↓           ↓
                 Coordinates    Extracts   Performs    Generates   Indexes for
                  Workflow       Text       NLP       Summaries    Search/Q&A
```

### Data Flow Architecture

```
1. Document Ingestion:
   User Upload → API → Database → Message Bus → Curator Agent

2. Processing Pipeline:
   Curator → (text extraction) → Analyzer → (NLP) → Summarizer → (summaries) → Query → (indexing)

3. Query Processing:
   User Query → API → Query Agent → Vector Store → QA Model → Response

4. Monitoring:
   All Agents → Message Bus → Metrics Collector → Monitoring API → Frontend
```

---

## Quick Setup

### Prerequisites

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **8GB RAM**: Minimum for ML models
- **4 CPU cores**: Recommended for optimal performance

### One-Command Deployment

```bash
# Clone the repository
git clone git@github.com:d-kimanthi/multi_agent_document_processor.git
cd multi_agent_document_processor/backend

# Start the entire platform
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs if needed
docker-compose logs -f
```

### Verify Installation

```bash
# Frontend available at:
curl http://localhost:3000

# Backend API documentation:
curl http://localhost:8000/docs

# Health check:
curl http://localhost:8000/health

# Agent status:
curl http://localhost:8000/api/v1/agents/status
```

---

## 💻 Development Setup

### Local Development Environment

#### 1. Backend Development

```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download NLP models
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start supporting services
docker-compose up -d db redis chroma

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn app.main:app --reload
```

#### 2. Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

### Development Workflow

```bash
# Terminal 1: Backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Supporting services
docker-compose up db redis chroma

# Terminal 4: Testing
pytest  # Backend tests
cd frontend && npm test  # Frontend tests
```

---

## Production Deployment

### Docker Production Setup

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Production Configuration

```yaml
# docker-compose.prod.yml highlights
version: "3.8"
services:
  app:
    build: .
    environment:
      - DEBUG=false
      - LOG_LEVEL=WARNING
      - WORKERS=4
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Cloud Deployment Options

#### AWS Deployment

```bash
# Using AWS ECS
aws ecs create-cluster --cluster-name doc-intelligence

# Or using AWS App Runner
aws apprunner create-service --service-name doc-platform \
  --source-configuration file://apprunner-config.json
```

#### Google Cloud Platform

```bash
# Using Cloud Run
gcloud run deploy doc-intelligence --source .

# Or using GKE
kubectl apply -f deployment/kubernetes/
```

---

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4GB (8GB recommended)
- **Storage**: 10GB free space
- **Network**: Stable internet for model downloads

## Configuration Guide

### Environment Variables

```bash
# .env file configuration

# Application Settings
APP_NAME="Smart Document Intelligence Platform"
DEBUG=false
API_V1_STR="/api/v1"

# Database Configuration
DATABASE_URL="postgresql+asyncpg://user:pass@localhost/docplatform"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Vector Database
VECTOR_DB_TYPE="chroma"
CHROMA_HOST="localhost"
CHROMA_PORT="8001"

# NLP Model Configuration
SPACY_MODEL="en_core_web_sm"
SENTENCE_TRANSFORMER_MODEL="all-MiniLM-L6-v2"
SUMMARIZATION_MODEL="facebook/bart-large-cnn"

# Agent System Configuration
AGENT_MAX_RETRIES=3
AGENT_TIMEOUT=30
MESSAGE_QUEUE_SIZE=1000

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR="uploads"

# Monitoring & Logging
METRICS_ENABLED=true
LOG_LEVEL="INFO"
```

### Database Configuration

```python
# Advanced database configuration
DATABASE_SETTINGS = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,
    "pool_recycle": 3600,
    "echo": False  # Set to True for SQL logging
}
```

### Agent Configuration

```python
# Customize agent behavior
AGENT_CONFIG = {
    "orchestrator": {
        "max_concurrent_workflows": 10,
        "workflow_timeout": 300
    },
    "curator": {
        "supported_formats": [".pdf", ".docx", ".txt"],
        "max_file_size": 50 * 1024 * 1024
    },
    "analyzer": {
        "batch_size": 10,
        "confidence_threshold": 0.7
    }
}
```

---

## Testing & Validation

### Automated Testing Suite

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_agents/          # Agent system tests
pytest tests/test_nlp/             # NLP processing tests
pytest tests/test_api/             # API endpoint tests

# Run with coverage
pytest --cov=app tests/

# Performance tests
pytest tests/test_performance/ -v
```

### Manual Testing Checklist

```markdown
- [ ] Document upload (PDF, DOCX, TXT)
- [ ] Agent coordination and communication
- [ ] NLP analysis (entities, sentiment, topics)
- [ ] Vector search and Q&A functionality
- [ ] Real-time monitoring and metrics
- [ ] Error handling and recovery
- [ ] System performance under load
```

### Integration Testing

```bash
# Test document processing pipeline
python scripts/test_integration.py

# Test agent communication
python scripts/test_agents.py

# Test NLP accuracy
python scripts/test_nlp_accuracy.py
```

---

## Monitoring & Observability

### Health Checks

```bash
# System health
curl http://localhost:8000/health

# Agent status
curl http://localhost:8000/api/v1/agents/status

# Database connectivity
curl http://localhost:8000/api/v1/health/db

# Vector store connectivity
curl http://localhost:8000/api/v1/health/vector-store
```

### Metrics Collection

```python
# Built-in metrics endpoints
GET /api/v1/agents/metrics          # Agent performance
GET /api/v1/agents/messages         # Message history
GET /api/v1/agents/workflows        # Workflow status
```

### Log Monitoring

```bash
# View logs
docker-compose logs -f app          # Application logs
docker-compose logs -f db           # Database logs
docker-compose logs -f chroma       # Vector store logs

# Log locations in container
/app/logs/app_YYYYMMDD.log          # Application logs
/app/logs/agent_activity.log        # Agent communication logs
```

### Debug Mode Setup

```bash
# Enable debug mode
export DEBUG=true
export LOG_LEVEL=DEBUG

# Start with debug logging
uvicorn app.main:app --reload --log-level debug

# Monitor agent communication
tail -f logs/agent_activity.log
```

---

## 📚 Additional Resources

### Documentation Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [spaCy Documentation](https://spacy.io/usage)
- [ChromaDB Documentation](https://docs.trychroma.com/)

### Model Information

- [Sentence Transformers Models](https://huggingface.co/sentence-transformers)
- [BART Summarization](https://huggingface.co/facebook/bart-large-cnn)
- [spaCy Language Models](https://spacy.io/models/en)

---

## 🎯 Next Steps

1. **Customize Configuration** - Adjust settings for your environment
2. **Add Custom Agents** - Extend the multi-agent system
3. **Integrate Additional NLP Models** - Add domain-specific models
4. **Scale for Production** - Implement load balancing and monitoring
5. **Enhance Security** - Add authentication and authorization
