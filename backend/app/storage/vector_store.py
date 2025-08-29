from abc import ABC, abstractmethod
import asyncio
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings as ChromaSettings
import json
import uuid

from app.config import settings


class VectorStore(ABC):
    @abstractmethod
    async def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        pass

    @abstractmethod
    async def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete_document(self, document_id: str) -> bool:
        pass


class ChromaVectorStore(VectorStore):
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_model = None

    async def initialize(self):
        """Initialize ChromaDB client and collection"""

        def init_sync():
            self.client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(allow_reset=True),
            )

            # Get or create collection
            try:
                self.collection = self.client.get_collection("documents")
            except:
                self.collection = self.client.create_collection(
                    name="documents",
                    metadata={"description": "Document embeddings for search"},
                )

            # Load embedding model
            self.embedding_model = SentenceTransformer(
                settings.SENTENCE_TRANSFORMER_MODEL
            )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, init_sync)
        print("ChromaDB vector store initialized")

    async def add_documents(self, documents: List[Dict[str, Any]]) -> List[str]:
        """Add documents to vector store"""

        def add_sync():
            # Extract texts for embedding
            texts = [doc["text"] for doc in documents]

            # Generate embeddings
            embeddings = self.embedding_model.encode(texts).tolist()

            # Prepare metadata
            metadatas = []
            ids = []

            for doc in documents:
                doc_id = doc.get("id", str(uuid.uuid4()))
                ids.append(doc_id)

                metadata = {
                    "document_id": doc.get("document_id"),
                    "chunk_index": doc.get("chunk_index", 0),
                    "source": doc.get("source", ""),
                    "type": doc.get("type", "text"),
                }
                metadatas.append(metadata)

            # Add to collection
            self.collection.add(
                embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids
            )

            return ids

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, add_sync)

    async def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""

        def search_sync():
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query]).tolist()

            # Search
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=k,
                include=["documents", "metadatas", "distances"],
            )

            # Format results
            formatted_results = []
            for i in range(len(results["documents"][0])):
                result = {
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "score": 1
                    - results["distances"][0][i],  # Convert distance to similarity
                    "id": results["ids"][0][i] if "ids" in results else None,
                }
                formatted_results.append(result)

            return formatted_results

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, search_sync)

    async def delete_document(self, document_id: str) -> bool:
        """Delete document from vector store"""

        def delete_sync():
            try:
                # Find all chunks for this document
                results = self.collection.get(
                    where={"document_id": {"$eq": document_id}}, include=["ids"]
                )

                if results["ids"]:
                    self.collection.delete(ids=results["ids"])
                    return True
                return False

            except Exception as e:
                print(f"Error deleting document {document_id}: {e}")
                return False

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, delete_sync)


# Global vector store instance
_vector_store: Optional[VectorStore] = None


async def init_vector_store():
    """Initialize the global vector store"""
    global _vector_store

    if settings.VECTOR_DB_TYPE == "chroma":
        _vector_store = ChromaVectorStore()
        await _vector_store.initialize()
    else:
        raise ValueError(f"Unsupported vector database type: {settings.VECTOR_DB_TYPE}")


def get_vector_store() -> VectorStore:
    """Get the global vector store instance"""
    if _vector_store is None:
        raise RuntimeError("Vector store not initialized")
    return _vector_store
