import aiofiles
import asyncio
from typing import Optional
import fitz  # PyMuPDF for PDF extraction
from docx import Document as DocxDocument
import io


class DocumentExtractor:
    def __init__(self):
        self.initialized = False

    async def initialize(self):
        """Initialize extractor components"""
        # Could load ML models for OCR here if needed
        self.initialized = True

    async def cleanup(self):
        """Cleanup resources"""
        pass

    async def extract_text(self, file_path: str, mime_type: str) -> str:
        """Extract text from various document formats"""
        if mime_type == "text/plain":
            return await self._extract_text_file(file_path)
        elif mime_type == "application/pdf":
            return await self._extract_pdf(file_path)
        elif (
            mime_type
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            return await self._extract_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {mime_type}")

    async def extract_sample(
        self, file_path: str, mime_type: str, max_chars: int = 1000
    ) -> str:
        """Extract a small sample of text for validation"""
        full_text = await self.extract_text(file_path, mime_type)
        return full_text[:max_chars] if full_text else ""

    async def _extract_text_file(self, file_path: str) -> str:
        """Extract text from plain text file"""
        async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
            return await f.read()

    async def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""

        def extract_sync():
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text

        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, extract_sync)

    async def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""

        def extract_sync():
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, extract_sync)
