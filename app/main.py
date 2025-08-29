from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config import settings
from app.database import init_db
from app.agents.orchestrator_agent import OrchestratorAgent
from app.api import documents, analysis, query, agents
from app.utils.logger import setup_logging
from app.storage.vector_store import init_vector_store

# Global orchestrator instance
orchestrator: OrchestratorAgent = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    await init_db()
    await init_vector_store()

    global orchestrator
    orchestrator = OrchestratorAgent()
    await orchestrator.initialize()

    yield

    # Shutdown
    if orchestrator:
        await orchestrator.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(
    documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"]
)
app.include_router(
    analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"]
)
app.include_router(query.router, prefix=f"{settings.API_V1_STR}/query", tags=["query"])
app.include_router(
    agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"]
)


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "orchestrator_status": (
            orchestrator.status if orchestrator else "not_initialized"
        ),
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
