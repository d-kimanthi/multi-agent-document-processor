from typing import Dict, Any, Optional
import os
import mimetypes
from pathlib import Path
import aiofiles
import hashlib

from app.agents.base_agent import BaseAgent, Message, MessageType
from app.nlp.extractors import DocumentExtractor
from app.nlp.processors import TextProcessor
from app.database import SessionLocal, Document
from sqlalchemy.ext.asyncio import AsyncSession


class CuratorAgent(BaseAgent):
    def __init__(self):
        super().__init__("curator", "curator")
        self.extractor = None
        self.processor = None

    async def initialize(self):
        """Initialize document processing components"""
        self.extractor = DocumentExtractor()
        self.processor = TextProcessor()
        await self.extractor.initialize()
        await self.processor.initialize()
        print("Curator agent initialized")

    async def cleanup(self):
        """Cleanup resources"""
        if self.extractor:
            await self.extractor.cleanup()
        if self.processor:
            await self.processor.cleanup()

    async def process_message(self, message: Message) -> Optional[Message]:
        """Process curator-specific messages"""
        if message.message_type != MessageType.REQUEST:
            return None

        action = message.payload.get("action")

        if action == "ingest_document":
            return await self._ingest_document(message)
        elif action == "validate_document":
            return await self._validate_document(message)
        elif action == "get_document_info":
            return await self._get_document_info(message)

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.ERROR,
            payload={"error": f"Unknown action: {action}"},
        )

    async def _ingest_document(self, message: Message) -> Message:
        """Main document ingestion workflow"""
        try:
            document_id = message.payload.get("document_id")
            file_path = message.payload.get("file_path")
            workflow_id = message.payload.get("workflow_id")

            # Step 1: Validate file exists and is readable
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            # Step 2: Extract file metadata
            file_stats = os.stat(file_path)
            mime_type, _ = mimetypes.guess_type(file_path)

            # Step 3: Extract text content
            extracted_text = await self.extractor.extract_text(file_path, mime_type)

            if not extracted_text or len(extracted_text.strip()) == 0:
                raise ValueError("No text content could be extracted from document")

            # Step 4: Preprocess text
            processed_text = await self.processor.preprocess_text(extracted_text)

            # Step 5: Create text chunks for processing
            chunks = await self.processor.create_chunks(
                processed_text, max_chunk_size=1000, overlap=200
            )

            # Step 6: Generate document fingerprint
            content_hash = hashlib.sha256(extracted_text.encode()).hexdigest()

            # Step 7: Store processed document info in database
            async with SessionLocal() as db:
                db_document = await db.get(Document, document_id)
                if db_document:
                    db_document.status = "processing"
                    db_document.processed_date = None
                    await db.commit()

            # Step 8: Prepare results for next agent
            result = {
                "document_id": document_id,
                "original_text": extracted_text,
                "processed_text": processed_text,
                "chunks": chunks,
                "content_hash": content_hash,
                "metadata": {
                    "file_size": file_stats.st_size,
                    "mime_type": mime_type,
                    "chunk_count": len(chunks),
                    "character_count": len(extracted_text),
                    "word_count": len(extracted_text.split()),
                },
            }

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "workflow_id": workflow_id,
                    "result": result,
                    "status": "completed",
                    "message": f"Document {document_id} successfully ingested and preprocessed",
                },
            )

        except Exception as e:
            # Update document status in database
            try:
                async with SessionLocal() as db:
                    db_document = await db.get(Document, document_id)
                    if db_document:
                        db_document.status = "error"
                        await db.commit()
            except:
                pass  # Don't fail on database error during error handling

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={
                    "workflow_id": workflow_id,
                    "error": str(e),
                    "document_id": document_id,
                },
            )

    async def _validate_document(self, message: Message) -> Message:
        """Validate document before processing"""
        file_path = message.payload.get("file_path")

        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "metadata": {},
        }

        try:
            # Check file exists
            if not os.path.exists(file_path):
                validation_results["valid"] = False
                validation_results["errors"].append("File does not exist")

            # Check file size
            file_stats = os.stat(file_path)
            if file_stats.st_size == 0:
                validation_results["valid"] = False
                validation_results["errors"].append("File is empty")
            elif file_stats.st_size > 50 * 1024 * 1024:  # 50MB limit
                validation_results["warnings"].append(
                    "File is very large, processing may take time"
                )

            # Check file type
            mime_type, _ = mimetypes.guess_type(file_path)
            supported_types = [
                "text/plain",
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]

            if mime_type not in supported_types:
                validation_results["valid"] = False
                validation_results["errors"].append(
                    f"Unsupported file type: {mime_type}"
                )

            # Try to extract a small sample
            if validation_results["valid"]:
                try:
                    sample_text = await self.extractor.extract_sample(
                        file_path, mime_type, max_chars=1000
                    )
                    if not sample_text or len(sample_text.strip()) == 0:
                        validation_results["valid"] = False
                        validation_results["errors"].append(
                            "No text content could be extracted"
                        )
                    else:
                        validation_results["metadata"]["sample_length"] = len(
                            sample_text
                        )
                        validation_results["metadata"]["estimated_pages"] = (
                            file_stats.st_size // 2000
                        )  # Rough estimate
                except Exception as e:
                    validation_results["valid"] = False
                    validation_results["errors"].append(
                        f"Text extraction failed: {str(e)}"
                    )

            validation_results["metadata"].update(
                {
                    "file_size": file_stats.st_size,
                    "mime_type": mime_type,
                    "file_extension": Path(file_path).suffix,
                }
            )

        except Exception as e:
            validation_results["valid"] = False
            validation_results["errors"].append(f"Validation error: {str(e)}")

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.RESPONSE,
            payload={"validation_results": validation_results},
        )

    async def _get_document_info(self, message: Message) -> Message:
        """Get information about a processed document"""
        document_id = message.payload.get("document_id")

        try:
            async with SessionLocal() as db:
                db_document = await db.get(Document, document_id)
                if not db_document:
                    return Message(
                        from_agent=self.agent_id,
                        to_agent=message.from_agent,
                        message_type=MessageType.ERROR,
                        payload={"error": f"Document {document_id} not found"},
                    )

                document_info = {
                    "id": db_document.id,
                    "filename": db_document.filename,
                    "file_size": db_document.file_size,
                    "mime_type": db_document.mime_type,
                    "upload_date": db_document.upload_date.isoformat(),
                    "processed_date": (
                        db_document.processed_date.isoformat()
                        if db_document.processed_date
                        else None
                    ),
                    "status": db_document.status,
                }

                return Message(
                    from_agent=self.agent_id,
                    to_agent=message.from_agent,
                    message_type=MessageType.RESPONSE,
                    payload={"document_info": document_info},
                )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )
