# app/api/query.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.agents.orchestrator_agent import get_orchestrator
from app.agents.base_agent import MessageType
from app.storage.vector_store import get_vector_store

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    max_results: int = 5
    document_ids: Optional[List[int]] = None


class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    query: str


class SearchRequest(BaseModel):
    query: str
    max_results: int = 10


@router.post("/ask", response_model=Dict[str, Any])
async def ask_question(request: QueryRequest):
    """Ask a question about the document corpus"""

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    orchestrator = get_orchestrator()
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Query service not available")

    try:
        # For demo purposes, we'll simulate the query process
        # In a real implementation, you'd wait for the actual agent response

        vector_store = get_vector_store()
        search_results = await vector_store.search(request.query, k=request.max_results)

        # Simulate QA processing
        if search_results:
            best_result = search_results[0]
            simulated_answer = (
                f"Based on the available documents, {request.query.lower()}"
            )
            confidence = best_result["score"]
        else:
            simulated_answer = (
                "I couldn't find relevant information to answer your question."
            )
            confidence = 0.0

        sources = [
            {
                "document_id": result["metadata"].get("document_id"),
                "chunk_index": result["metadata"].get("chunk_index"),
                "similarity_score": result["score"],
                "text_snippet": (
                    result["text"][:200] + "..."
                    if len(result["text"]) > 200
                    else result["text"]
                ),
            }
            for result in search_results[:3]  # Top 3 sources
        ]

        return {
            "answer": simulated_answer,
            "confidence": confidence,
            "sources": sources,
            "query": request.query,
            "processing_time_ms": 150,  # Simulated
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Query processing failed: {str(e)}"
        )


@router.post("/search")
async def search_documents(request: SearchRequest):
    """Search for similar document chunks"""

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    try:
        vector_store = get_vector_store()
        search_results = await vector_store.search(request.query, k=request.max_results)

        formatted_results = []
        for result in search_results:
            formatted_results.append(
                {
                    "document_id": result["metadata"].get("document_id"),
                    "chunk_index": result["metadata"].get("chunk_index"),
                    "similarity_score": result["score"],
                    "text": result["text"],
                    "metadata": result["metadata"],
                }
            )

        return {
            "query": request.query,
            "results": formatted_results,
            "total_results": len(formatted_results),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/{document_id}/similar")
async def get_similar_documents(
    document_id: int,
    max_results: int = Query(
        5, description="Maximum number of similar documents to return"
    ),
    db: AsyncSession = Depends(get_db),
):
    """Find documents similar to the specified document"""

    orchestrator = get_orchestrator()
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Query service not available")

    try:
        # Send request to query agent
        await orchestrator.send_message(
            "query",
            MessageType.REQUEST,
            {
                "action": "get_similar_documents",
                "document_id": document_id,
                "max_results": max_results,
            },
        )

        # For demo purposes, return a placeholder response
        # In a real implementation, you'd wait for the agent response
        return {
            "message": f"Finding documents similar to document {document_id}",
            "document_id": document_id,
            "max_results": max_results,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Similar document search failed: {str(e)}"
        )


@router.get("/history")
async def get_query_history(
    limit: int = Query(50, description="Number of recent queries to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get history of recent queries (placeholder for now)"""

    # In a real implementation, you'd store query history in the database
    # For now, return a placeholder
    return {
        "message": "Query history feature coming soon",
        "total_queries": 0,
        "recent_queries": [],
    }


@router.get("/stats")
async def get_query_stats():
    """Get query processing statistics"""

    try:
        vector_store = get_vector_store()

        # Get some basic stats (this would be more detailed in a real implementation)
        return {
            "vector_store_type": settings.VECTOR_DB_TYPE,
            "embedding_model": settings.SENTENCE_TRANSFORMER_MODEL,
            "status": "operational",
            "total_indexed_documents": "N/A",  # Would query the vector store
            "average_query_time_ms": 150,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
