# README.md

# Smart Document Intelligence Platform

A comprehensive multi-agent system for document processing, analysis, and intelligent querying using advanced NLP techniques.

## 🚀 Features

### Core Capabilities

- **Multi-Agent Architecture**: Coordinated agents handle different aspects of document processing
- **Document Processing**: Support for PDF, DOCX, and TXT files with intelligent text extraction
- **NLP Analysis**: Named Entity Recognition, sentiment analysis, topic modeling, and keyword extraction
- **Vector Search**: Semantic document search and similarity matching using embeddings
- **Q&A System**: Intelligent question-answering over document corpus using RAG (Retrieval-Augmented Generation)
- **Real-time Monitoring**: Agent communication tracking and performance metrics

### Agent System

1. **Orchestrator Agent**: Coordinates workflows and manages agent communication
2. **Curator Agent**: Handles document ingestion and preprocessing
3. **Analyzer Agent**: Performs comprehensive NLP analysis
4. **Summarizer Agent**: Generates multiple types of document summaries
5. **Query Agent**: Manages search and question-answering functionality

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   PostgreSQL    │
│   (React)       │◄──►│   Backend       │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌─────────────┐    ┌─────────────────┐
            │  ChromaDB   │    │   Multi-Agent   │
            │ Vector Store│    │    System       │
            └─────────────┘    └─────────────────┘
                                       │
        ┌──────────────┬───────────────┼────────────────┬──────────────┐
        │              │               │                │              │
┌───────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Orchestrator│ │  Curator    │ │  Analyzer   │ │ Summarizer  │ │   Query     │
│   Agent    │ │   Agent     │ │   Agent     │ │   Agent     │ │   Agent     │
└───────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

## 🛠️ Technology Stack

### Backend

- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: ORM with async support
- **PostgreSQL**: Primary database
- **Redis**: Caching and message queuing
- **ChromaDB**: Vector database for embeddings

### NLP & ML

- **spaCy**: NLP processing and NER
- **Transformers**: Hugging Face models for summarization and Q&A
- **Sentence Transformers**: Text embeddings
- **scikit-learn**: Topic modeling and analysis

### Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **Uvicorn**: ASGI server

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- 8GB+ RAM (for ML models)

### Using Docker Compose (Recommended)

1. **Clone the repository**

```bash
git clone <repository-url>
cd smart_document_platform
```

2. **Create environment file**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the services**

```bash
docker-compose up -d
```

4. **Check service health**

```bash
curl http://localhost:8000/health
```

### Local Development Setup

1. **Install dependencies**

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

2. **Set up database**

```bash
# Start PostgreSQL and Redis
docker-compose up -d db redis chroma

# Run migrations (if using Alembic)
alembic upgrade head
```

3. **Start the application**

```bash
uvicorn app.main:app --reload
```

## 📖 API Documentation

Once the application is running, visit:

- **API Documentation**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

### Key Endpoints

#### Document Management

- `POST /api/v1/documents/upload` - Upload a document
- `GET /api/v1/documents/` - List all documents
- `GET /api/v1/documents/{id}` - Get document details
- `POST /api/v1/documents/{id}/reprocess` - Reprocess a document

#### Analysis

- `GET /api/v1/analysis/{document_id}` - Get analysis results
- `GET /api/v1/analysis/{document_id}/entities` - Get named entities
- `GET /api/v1/analysis/{document_id}/sentiment` - Get sentiment analysis
- `POST /api/v1/analysis/analyze-text` - Analyze arbitrary text

#### Query & Search

- `POST /api/v1/query/ask` - Ask questions about documents
- `POST /api/v1/query/search` - Search document corpus
- `GET /api/v1/query/{document_id}/similar` - Find similar documents

#### Agent Monitoring

- `GET /api/v1/agents/status` - Agent system status
- `GET /api/v1/agents/messages` - Inter-agent message history
- `GET /api/v1/agents/workflows` - Active workflow status
- `GET /api/v1/agents/metrics` - System performance metrics

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Application
DEBUG=false
API_V1_STR="/api/v1"

# Database
DATABASE_URL="postgresql://user:pass@localhost/dbname"

# Vector Database
VECTOR_DB_TYPE="chroma"
CHROMA_HOST="localhost"
CHROMA_PORT="8001"

# NLP Models
SPACY_MODEL="en_core_web_sm"
SENTENCE_TRANSFORMER_MODEL="all-MiniLM-L6-v2"

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR="uploads"
```

## 🧪 Usage Examples

### Document Upload and Processing

```python
import requests

# Upload a document
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/v1/documents/upload",
        files={"file": f}
    )
document = response.json()
print(f"Document uploaded: {document['id']}")

# Check processing status
status_response = requests.get(
    f"http://localhost:8000/api/v1/documents/{document['id']}"
)
print(f"Status: {status_response.json()['status']}")
```

### Query Documents

```python
# Ask a question
query_response = requests.post(
    "http://localhost:8000/api/v1/query/ask",
    json={
        "query": "What are the main topics discussed?",
        "max_results": 5
    }
)
result = query_response.json()
print(f"Answer: {result['answer']}")
print(f"Confidence: {result['confidence']}")
```

### Get Analysis Results

```python
# Get NLP analysis
analysis_response = requests.get(
    f"http://localhost:8000/api/v1/analysis/{document['id']}"
)
analysis = analysis_response.json()
print(f"Entities found: {len(analysis['analysis_results']['entities'])}")
print(f"Sentiment: {analysis['analysis_results']['sentiment']['label']}")
```

## 🔍 Monitoring and Debugging

### Agent System Status

```bash
curl http://localhost:8000/api/v1/agents/status
```

### View Agent Communication

```bash
curl http://localhost:8000/api/v1/agents/messages?limit=50
```

### System Metrics

```bash
curl http://localhost:8000/api/v1/agents/metrics
```

## 🚀 Deployment

### Production Deployment

1. **Update environment variables for production**
2. **Use production database settings**
3. **Configure proper logging and monitoring**
4. **Set up reverse proxy (nginx)**
5. **Use production WSGI server settings**

### Scaling Considerations

- **Agent scaling**: Agents can be distributed across multiple containers
- **Database optimization**: Use connection pooling and read replicas
- **Vector store**: Consider distributed vector databases for large datasets
- **Caching**: Implement Redis clustering for high availability

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test category
pytest tests/test_agents/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- **Multi-language support**: Extend NLP capabilities to other languages
- **Advanced summarization**: Implement more sophisticated summarization techniques
- **Real-time collaboration**: Add multi-user document collaboration features
- **Advanced search**: Implement more complex query capabilities
- **Custom models**: Support for domain-specific fine-tuned models
- **API rate limiting**: Implement proper rate limiting and authentication
- **Workflow customization**: Allow users to define custom processing workflows

# Code Documentation - Smart Document Intelligence Platform

This document provides detailed explanations of what each Python file does in the Smart Document Intelligence Platform, organized by module and functionality.

## 📁 Project Structure Overview

```
smart_document_platform/
├── app/                    # Main application package
│   ├── main.py            # FastAPI application entry point
│   ├── config.py          # Configuration settings
│   ├── database.py        # Database connection and models
│   ├── agents/            # Multi-agent system
│   ├── nlp/              # NLP processing modules
│   ├── api/              # API route handlers
│   ├── models/           # Pydantic data models
│   ├── storage/          # Data storage abstractions
│   └── utils/            # Utility functions
```

---

## 🚀 Core Application Files

### `app/main.py` - Application Entry Point

**Purpose**: FastAPI application initialization and lifecycle management

**Key Functions**:

- **Application Setup**: Configures FastAPI app with CORS, middleware, and routing
- **Lifecycle Management**: Uses `lifespan` context manager to handle startup/shutdown
- **Agent Initialization**: Starts the orchestrator and all sub-agents on startup
- **Health Checks**: Provides system health endpoints
- **Route Registration**: Includes all API route modules

**Key Components**:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database, vector store, and agents
    # Shutdown: Clean up resources
```

**Dependencies**: All other modules depend on this for application lifecycle

---

### `app/config.py` - Configuration Management

**Purpose**: Centralized configuration using Pydantic settings

**Key Features**:

- **Environment Variables**: Loads settings from `.env` file
- **Type Validation**: Uses Pydantic for automatic type checking
- **Default Values**: Provides sensible defaults for all settings
- **Categorized Settings**: Groups related settings (database, NLP models, agents, etc.)

**Configuration Categories**:

- Database connection strings
- NLP model specifications
- Agent behavior parameters
- File upload limits
- Vector database settings
- Monitoring configuration

**Usage Pattern**: `from app.config import settings`

---

### `app/database.py` - Database Layer

**Purpose**: Database models, connection management, and ORM setup

**Key Components**:

#### **SQLAlchemy Models**:

- **`Document`**: Stores uploaded document metadata
- **`AnalysisResult`**: Stores NLP analysis results by type
- **`DocumentEmbedding`**: Tracks vector embeddings for search
- **`WorkflowExecution`**: Monitors agent workflow progress
- **`AgentMetrics`**: Stores agent performance data

#### **Database Functions**:

- **`get_db()`**: Dependency injection for database sessions
- **`init_db()`**: Creates all tables and indexes
- **`close_db()`**: Cleanup database connections

**Relationships**:

```python
Document -> AnalysisResult (one-to-many)
Document -> DocumentEmbedding (one-to-many)
```

**Async Support**: Uses `asyncpg` for async PostgreSQL operations

---

## 🤖 Agent System (`app/agents/`)

### `app/agents/base_agent.py` - Agent Foundation

**Purpose**: Abstract base class defining the agent interface and core functionality

**Key Classes**:

#### **`BaseAgent`** (Abstract Base Class):

- **Message Processing**: Handles incoming messages via async queue
- **Status Management**: Tracks agent state (idle, busy, error, stopped)
- **Metrics Collection**: Monitors performance and error rates
- **Lifecycle Management**: Start/stop/cleanup methods

#### **Core Methods**:

```python
async def process_message(message: Message) -> Optional[Message]:
    # Abstract method - implemented by each agent type

async def send_message(to_agent: str, message_type: MessageType, payload: Dict):
    # Send messages to other agents via message bus
```

#### **`Message`** (Pydantic Model):

- Structured inter-agent communication
- Correlation IDs for tracking conversations
- Timestamps and routing information

**Message Loop**: Each agent runs an async loop processing incoming messages

---

### `app/agents/communication.py` - Message Bus System

**Purpose**: Facilitates communication between agents with message routing and history

**Key Classes**:

#### **`MessageBus`** (Singleton):

- **Agent Registry**: Maintains list of active agents
- **Message Routing**: Delivers messages to target agents
- **History Tracking**: Stores message history for monitoring
- **Broadcast Support**: Send messages to multiple agents

#### **Core Functions**:

```python
async def send_message(message: Message):
    # Route message to target agent's queue

async def broadcast_message(message: Message):
    # Send to all agents except sender
```

**Queue Management**: Handles full queues and delivery failures

---

### `app/agents/orchestrator_agent.py` - Workflow Coordinator

**Purpose**: Master agent that coordinates document processing workflows

**Key Responsibilities**:

#### **Workflow Management**:

- **Document Processing Pipeline**: Coordinates multi-step workflows
- **Agent Coordination**: Routes work between curator → analyzer → summarizer → query
- **Error Handling**: Manages workflow failures and retries
- **Status Tracking**: Monitors progress through each workflow step

#### **Workflow Steps**:

1. **Document Ingestion** (Curator Agent)
2. **Text Analysis** (Analyzer Agent)
3. **Summarization** (Summarizer Agent)
4. **Indexing** (Query Agent)
5. **Completion** (Notifications)

#### **Key Classes**:

```python
class DocumentWorkflow:
    # Tracks individual document processing state

class WorkflowStatus(Enum):
    # PENDING, PROCESSING, COMPLETED, FAILED
```

**Sub-agent Management**: Creates and manages all other agents

---

### `app/agents/curator_agent.py` - Document Ingestion

**Purpose**: Handles document upload, validation, and text extraction

**Key Responsibilities**:

#### **Document Processing**:

- **File Validation**: Checks file type, size, and readability
- **Text Extraction**: Extracts text from PDF, DOCX, TXT files
- **Preprocessing**: Cleans and normalizes extracted text
- **Chunking**: Splits documents into manageable pieces

#### **Core Methods**:

```python
async def _ingest_document(message: Message):
    # Main document processing workflow

async def _validate_document(message: Message):
    # Pre-processing validation
```

**Dependencies**: Uses `DocumentExtractor` and `TextProcessor` from NLP module

---

### `app/agents/analyzer_agent.py` - NLP Analysis

**Purpose**: Performs comprehensive NLP analysis on processed documents

**Key Responsibilities**:

#### **Analysis Types**:

- **Named Entity Recognition**: Extracts people, places, organizations
- **Sentiment Analysis**: Determines document sentiment and confidence
- **Keyword Extraction**: Identifies important terms and phrases
- **Topic Modeling**: Discovers document themes using LDA

#### **Core Methods**:

```python
async def _analyze_document(message: Message):
    # Comprehensive analysis pipeline

async def _store_analysis_results(document_id, results, confidence):
    # Persist results to database
```

**Dependencies**: Uses `NLPAnalyzer` for actual NLP processing

---

### `app/agents/summarizer_agent.py` - Document Summarization

**Purpose**: Generates multiple types of document summaries

**Key Responsibilities**:

#### **Summary Types**:

- **Extractive**: Selects key sentences from original text
- **Abstractive**: AI-generated summaries using BART model
- **Executive**: Combines content summary with analysis insights
- **Insights**: Analysis-based key findings

#### **Core Methods**:

```python
async def _generate_abstractive_summary(text: str):
    # Uses Transformers BART model for AI summarization

async def _generate_insights_from_analysis(analysis_results):
    # Creates insights from NLP analysis results
```

**Quality Metrics**: Calculates compression ratios and summary quality scores

---

### `app/agents/query_agent.py` - Search and Q&A

**Purpose**: Manages document search and question-answering functionality

**Key Responsibilities**:

#### **Search Capabilities**:

- **Vector Indexing**: Stores document embeddings for semantic search
- **Similarity Search**: Finds relevant document chunks
- **Question Answering**: Uses RAG (Retrieval-Augmented Generation)
- **Answer Enhancement**: Adds context and confidence scores

#### **Core Methods**:

```python
async def _answer_query(message: Message):
    # RAG-based question answering

async def _index_document(message: Message):
    # Store document embeddings in vector database
```

**Dependencies**: Integrates with vector store and QA models

---

## 🧠 NLP Processing (`app/nlp/`)

### `app/nlp/extractors.py` - Text Extraction

**Purpose**: Extracts text content from various document formats

**Key Classes**:

#### **`DocumentExtractor`**:

- **Multi-format Support**: PDF, DOCX, TXT files
- **Async Processing**: Non-blocking text extraction
- **Error Handling**: Graceful handling of corrupted files

#### **Extraction Methods**:

```python
async def _extract_pdf(file_path: str):
    # Uses PyMuPDF (fitz) for PDF text extraction

async def _extract_docx(file_path: str):
    # Uses python-docx for Word document processing
```

**Threading**: Uses thread pools to avoid blocking the event loop

---

### `app/nlp/processors.py` - Text Processing

**Purpose**: Text preprocessing and chunking operations

**Key Classes**:

#### **`TextProcessor`**:

- **Text Cleaning**: Removes special characters, normalizes whitespace
- **Sentence Segmentation**: Uses spaCy for intelligent sentence splitting
- **Chunking Strategy**: Creates overlapping text chunks for processing
- **Embedding Generation**: Converts text to vector embeddings

#### **Core Methods**:

```python
async def preprocess_text(text: str):
    # Clean and normalize text content

async def create_chunks(text: str, max_chunk_size: int, overlap: int):
    # Split text into overlapping segments
```

**Model Dependencies**: spaCy for NLP, SentenceTransformers for embeddings

---

### `app/nlp/analyzers.py` - NLP Analysis Engine

**Purpose**: Core NLP analysis functionality using multiple models

**Key Classes**:

#### **`NLPAnalyzer`**:

- **Entity Extraction**: Uses spaCy NER models
- **Sentiment Analysis**: TextBlob-based sentiment scoring
- **Topic Modeling**: LDA with TF-IDF vectorization
- **Keyword Extraction**: Frequency and importance-based extraction

#### **Analysis Methods**:

```python
async def extract_entities(text: str):
    # Named entity recognition with confidence scores

async def analyze_sentiment(text: str):
    # Sentiment classification with polarity/subjectivity

async def extract_topics(texts: List[str], n_topics: int):
    # Topic modeling using Latent Dirichlet Allocation
```

**Model Integration**: Combines multiple NLP libraries for comprehensive analysis

---

## 🔌 API Layer (`app/api/`)

### `app/api/documents.py` - Document Management API

**Purpose**: REST endpoints for document upload and management

**Key Endpoints**:

#### **Document Operations**:

- **`POST /upload`**: Upload and queue documents for processing
- **`GET /`**: List documents with filtering options
- **`GET /{id}`**: Retrieve document details and status
- **`DELETE /{id}`**: Remove documents and associated files
- **`POST /{id}/reprocess`**: Restart processing pipeline

#### **Background Processing**:

```python
async def start_document_processing(document_id: int, file_path: str):
    # Triggers orchestrator workflow via message passing
```

**File Handling**: Validates file types, manages uploads, handles cleanup

---

### `app/api/analysis.py` - Analysis Results API

**Purpose**: Endpoints for retrieving NLP analysis results

**Key Endpoints**:

#### **Analysis Retrieval**:

- **`GET /{document_id}`**: Complete analysis results
- **`GET /{document_id}/entities`**: Named entities only
- **`GET /{document_id}/sentiment`**: Sentiment analysis only
- **`GET /{document_id}/topics`**: Topic modeling results
- **`POST /analyze-text`**: Analyze arbitrary text without upload

#### **Response Formatting**:

```python
{
    "document_id": 123,
    "analysis_results": {
        "entities": [...],
        "sentiment": {...},
        "topics": [...]
    },
    "confidence_scores": {...}
}
```

---

### `app/api/query.py` - Search and Q&A API

**Purpose**: Endpoints for document search and question-answering

**Key Endpoints**:

#### **Query Operations**:

- **`POST /ask`**: Ask questions about document corpus
- **`POST /search`**: Semantic search across documents
- **`GET /{document_id}/similar`**: Find similar documents
- **`GET /history`**: Query history tracking
- **`GET /stats`**: Search system statistics

#### **RAG Implementation**:

```python
# Question-answering flow:
1. Vector similarity search for relevant chunks
2. Extract answers using QA models
3. Enhance answers with context and confidence
4. Return with source attribution
```

---

### `app/api/agents.py` - Agent Monitoring API

**Purpose**: Endpoints for monitoring agent system health and performance

**Key Endpoints**:

#### **Monitoring Operations**:

- **`GET /status`**: Agent health and status
- **`GET /messages`**: Inter-agent message history
- **`GET /workflows`**: Active workflow tracking
- **`GET /metrics`**: Performance metrics and statistics
- **`POST /agents/{id}/restart`**: Agent restart functionality

#### **Metrics Collection**:

```python
{
    "system_metrics": {
        "total_messages_processed": 1234,
        "error_rate": 0.02,
        "average_processing_time": 0.15
    },
    "agent_metrics": {...}
}
```

---

## 🗃️ Data Models (`app/models/`)

### `app/models/document.py` - Document Data Models

**Purpose**: Pydantic models for document-related API requests/responses

**Key Models**:

- **`DocumentCreate`**: Document upload request
- **`DocumentResponse`**: Document API response
- **`DocumentAnalysis`**: Combined analysis results
- **`DocumentStatus`**: Processing status enumeration

### `app/models/analysis.py` - Analysis Data Models

**Purpose**: Structured models for NLP analysis results

**Key Models**:

- **`NamedEntity`**: Individual entity with position and confidence
- **`SentimentResult`**: Sentiment classification with scores
- **`TopicResult`**: Topic modeling output
- **`AnalysisResultResponse`**: Database result wrapper

### `app/models/agent.py` - Agent System Models

**Purpose**: Models for agent communication and monitoring

**Key Models**:

- **`AgentStatusResponse`**: Agent health information
- **`MessageResponse`**: Inter-agent message format
- **`WorkflowStatusResponse`**: Workflow progress tracking
- **`SystemStatusResponse`**: Overall system health

---

## 💾 Storage Layer (`app/storage/`)

### `app/storage/vector_store.py` - Vector Database Interface

**Purpose**: Abstraction layer for vector database operations

**Key Classes**:

#### **`VectorStore`** (Abstract Base Class):

- **Document Indexing**: Store text embeddings
- **Similarity Search**: Find semantically similar content
- **Document Management**: Add/delete document vectors

#### **`ChromaVectorStore`** (Implementation):

- **ChromaDB Integration**: Specific implementation for Chroma
- **Embedding Generation**: Uses SentenceTransformers
- **Metadata Management**: Stores document context with vectors

#### **Core Operations**:

```python
async def add_documents(documents: List[Dict]) -> List[str]:
    # Index documents with embeddings

async def search(query: str, k: int) -> List[Dict]:
    # Semantic similarity search
```

**Initialization**: Global instance management with factory pattern

---

## 🛠️ Utilities (`app/utils/`)

### `app/utils/logger.py` - Logging Configuration

**Purpose**: Centralized logging setup for the application

**Features**:

- **Multi-handler Setup**: Console and file logging
- **Structured Formatting**: Consistent log message format
- **Level Configuration**: Environment-based log levels
- **Third-party Suppression**: Reduces noise from dependencies

### `app/utils/metrics.py` - Performance Monitoring

**Purpose**: Application performance tracking and metrics collection

**Key Classes**:

#### **`MetricsCollector`**:

- **Request Tracking**: Count and timing of API calls
- **Error Monitoring**: Error rates and types
- **Response Times**: Performance distribution analysis
- **Agent Metrics**: Agent-specific performance data

#### **Decorator Support**:

```python
@track_metrics
async def api_endpoint():
    # Automatically tracks execution time and errors
```

### `app/utils/exceptions.py` - Custom Exception Handling

**Purpose**: Application-specific exception classes and error handling

**Custom Exceptions**:

- **`DocumentProcessingError`**: Document-specific errors
- **`AgentCommunicationError`**: Inter-agent messaging failures
- **`AnalysisError`**: NLP processing failures
- **`VectorStoreError`**: Vector database operation errors

---

## 🔄 Data Flow Summary

### 1. **Document Upload Flow**:

```
API Request → Document API → Orchestrator → Curator → Database
```

### 2. **Processing Pipeline**:

```
Curator (extract) → Analyzer (NLP) → Summarizer (summaries) → Query (index)
```

### 3. **Query Flow**:

```
API Request → Query Agent → Vector Store → QA Model → Enhanced Response
```

### 4. **Monitoring Flow**:

```
Agent Actions → Message Bus → Metrics Collector → Monitoring API
```

---

## 🎯 Key Design Patterns

### **Agent Pattern**:

- Each agent is an independent, stateful entity
- Agents communicate via message passing
- Asynchronous processing with queue management

### **Repository Pattern**:

- Database operations abstracted through models
- Consistent data access patterns
- Separation of business logic and data persistence

### **Factory Pattern**:

- Vector store creation based on configuration
- Agent instantiation through orchestrator
- Flexible component swapping

### **Observer Pattern**:

- Message bus broadcasts system events
- Metrics collection through decorators
- Status monitoring across agents

---

## 🚀 Extension Points

The codebase is designed for extensibility:

1. **New Agents**: Inherit from `BaseAgent` and implement `process_message()`
2. **Additional NLP**: Extend `NLPAnalyzer` with new analysis methods
3. **New Storage**: Implement `VectorStore` interface for different databases
4. **Custom Workflows**: Modify orchestrator workflow steps
5. **Additional APIs**: Add new router modules following existing patterns

Each module is designed with clear interfaces and minimal coupling, making the system highly maintainable and extensible for production use.
