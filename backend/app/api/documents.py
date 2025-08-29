from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path

from app.database import get_db, Document
from app.models.document import DocumentCreate, DocumentResponse, DocumentStatus
from app.config import settings
from app.agents.orchestrator_agent import get_orchestrator
from app.agents.base_agent import MessageType

router = APIRouter()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document for processing"""

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_extension} not supported. Allowed types: {settings.ALLOWED_EXTENSIONS}",
        )

    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size {file_size} exceeds maximum allowed size {settings.MAX_FILE_SIZE}",
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create database record
    db_document = Document(
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        status="uploaded",
    )

    db.add(db_document)
    await db.commit()
    await db.refresh(db_document)

    # Start processing workflow in background
    background_tasks.add_task(start_document_processing, db_document.id, file_path)

    return DocumentResponse.from_orm(db_document)


async def start_document_processing(document_id: int, file_path: str):
    """Start document processing workflow"""
    try:
        orchestrator = get_orchestrator()
        if orchestrator:
            workflow_id = f"workflow_{document_id}_{uuid.uuid4().hex[:8]}"

            await orchestrator.send_message(
                "orchestrator",
                MessageType.REQUEST,
                {
                    "action": "process_document",
                    "document_id": document_id,
                    "file_path": file_path,
                    "workflow_id": workflow_id,
                },
            )
    except Exception as e:
        print(f"Failed to start document processing: {e}")


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[DocumentStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all documents with optional filtering"""

    query = db.query(Document)

    if status:
        query = query.filter(Document.status == status.value)

    documents = await query.offset(skip).limit(limit).all()
    return [DocumentResponse.from_orm(doc) for doc in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Get document by ID"""

    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse.from_orm(document)


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document and its associated files"""

    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from filesystem
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        print(f"Warning: Failed to delete file {document.file_path}: {e}")

    # Delete from database
    await db.delete(document)
    await db.commit()

    return {"message": f"Document {document_id} deleted successfully"}


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Reprocess an existing document"""

    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=400, detail="Document file no longer exists")

    # Reset status
    document.status = "uploaded"
    document.processed_date = None
    await db.commit()

    # Start processing workflow
    background_tasks.add_task(
        start_document_processing, document_id, document.file_path
    )

    return {"message": f"Document {document_id} queued for reprocessing"}
