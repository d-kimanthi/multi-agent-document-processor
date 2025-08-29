from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any

from app.database import get_db, Document, AnalysisResult
from app.models.analysis import AnalysisResultResponse
from app.agents.orchestrator_agent import get_orchestrator
from app.agents.base_agent import MessageType

router = APIRouter()


@router.get("/{document_id}", response_model=Dict[str, Any])
async def get_document_analysis(
    document_id: int,
    analysis_type: Optional[str] = Query(None, description="Filter by analysis type"),
    db: AsyncSession = Depends(get_db),
):
    """Get analysis results for a document"""

    # Check if document exists
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Query analysis results
    query = db.query(AnalysisResult).filter(AnalysisResult.document_id == document_id)

    if analysis_type:
        query = query.filter(AnalysisResult.analysis_type == analysis_type)

    results = await query.all()

    if not results:
        # Check if document is still processing
        if document.status == "processing":
            raise HTTPException(
                status_code=202, detail="Document is still being processed"
            )
        elif document.status == "uploaded":
            raise HTTPException(
                status_code=202, detail="Document processing has not started"
            )
        else:
            raise HTTPException(status_code=404, detail="No analysis results found")

    # Group results by analysis type
    grouped_results = {}
    for result in results:
        grouped_results[result.analysis_type] = {
            "result_data": result.result_data,
            "confidence_score": result.confidence_score,
            "created_date": result.created_date,
            "agent_id": result.agent_id,
        }

    return {
        "document_id": document_id,
        "document_status": document.status,
        "analysis_results": grouped_results,
    }


@router.get("/{document_id}/entities")
async def get_document_entities(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get named entities for a document"""

    result = (
        await db.query(AnalysisResult)
        .filter(
            AnalysisResult.document_id == document_id,
            AnalysisResult.analysis_type == "entities",
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Entity analysis not found")

    return {
        "document_id": document_id,
        "entities": result.result_data,
        "confidence_score": result.confidence_score,
    }


@router.get("/{document_id}/sentiment")
async def get_document_sentiment(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get sentiment analysis for a document"""

    result = (
        await db.query(AnalysisResult)
        .filter(
            AnalysisResult.document_id == document_id,
            AnalysisResult.analysis_type == "sentiment",
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Sentiment analysis not found")

    return {
        "document_id": document_id,
        "sentiment": result.result_data,
        "confidence_score": result.confidence_score,
    }


@router.get("/{document_id}/topics")
async def get_document_topics(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get topic analysis for a document"""

    result = (
        await db.query(AnalysisResult)
        .filter(
            AnalysisResult.document_id == document_id,
            AnalysisResult.analysis_type == "topics",
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Topic analysis not found")

    return {
        "document_id": document_id,
        "topics": result.result_data,
        "confidence_score": result.confidence_score,
    }


@router.get("/{document_id}/keywords")
async def get_document_keywords(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get keywords for a document"""

    result = (
        await db.query(AnalysisResult)
        .filter(
            AnalysisResult.document_id == document_id,
            AnalysisResult.analysis_type == "keywords",
        )
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Keyword analysis not found")

    return {
        "document_id": document_id,
        "keywords": result.result_data,
        "confidence_score": result.confidence_score,
    }


@router.post("/analyze-text")
async def analyze_text(text: str, analysis_type: str = "all"):
    """Analyze arbitrary text without uploading a document"""

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    orchestrator = get_orchestrator()
    if not orchestrator:
        raise HTTPException(status_code=503, detail="Analysis service not available")

    try:
        # Send request to analyzer agent
        response = await orchestrator.send_message(
            "analyzer",
            MessageType.REQUEST,
            {"action": "analyze_text", "text": text, "analysis_type": analysis_type},
        )

        # Note: In a real implementation, you'd wait for the response
        # For now, return a placeholder
        return {
            "message": "Text analysis started",
            "text_length": len(text),
            "analysis_type": analysis_type,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/")
async def get_analysis_summary(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, description="Number of recent analyses to include"),
):
    """Get summary of recent analysis results"""

    recent_analyses = (
        await db.query(AnalysisResult)
        .order_by(AnalysisResult.created_date.desc())
        .limit(limit)
        .all()
    )

    # Group by analysis type
    summary = {}
    for analysis in recent_analyses:
        analysis_type = analysis.analysis_type
        if analysis_type not in summary:
            summary[analysis_type] = {
                "count": 0,
                "avg_confidence": 0.0,
                "recent_results": [],
            }

        summary[analysis_type]["count"] += 1
        summary[analysis_type]["avg_confidence"] += analysis.confidence_score or 0.0
        summary[analysis_type]["recent_results"].append(
            {
                "document_id": analysis.document_id,
                "confidence_score": analysis.confidence_score,
                "created_date": analysis.created_date,
            }
        )

    # Calculate averages
    for analysis_type in summary:
        if summary[analysis_type]["count"] > 0:
            summary[analysis_type]["avg_confidence"] /= summary[analysis_type]["count"]
        summary[analysis_type]["recent_results"] = summary[analysis_type][
            "recent_results"
        ][
            :5
        ]  # Latest 5

    return {"total_analyses": len(recent_analyses), "analysis_summary": summary}
