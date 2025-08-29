from typing import Dict, Any, Optional, List
from app.agents.base_agent import BaseAgent, Message, MessageType
from app.storage.vector_store import get_vector_store
from app.database import SessionLocal, Document, AnalysisResult
from transformers import pipeline
import asyncio


class QueryAgent(BaseAgent):
    def __init__(self):
        super().__init__("query", "query")
        self.vector_store = None
        self.qa_pipeline = None

    async def initialize(self):
        """Initialize query processing components"""
        self.vector_store = get_vector_store()

        def load_qa_model():
            # Load question-answering model
            self.qa_pipeline = pipeline(
                "question-answering",
                model="distilbert-base-cased-distilled-squad",
                tokenizer="distilbert-base-cased-distilled-squad",
            )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, load_qa_model)
        print("Query agent initialized")

    async def cleanup(self):
        """Cleanup resources"""
        self.vector_store = None
        self.qa_pipeline = None

    async def process_message(self, message: Message) -> Optional[Message]:
        """Process query-specific messages"""
        if message.message_type != MessageType.REQUEST:
            return None

        action = message.payload.get("action")

        if action == "answer_query":
            return await self._answer_query(message)
        elif action == "index_document":
            return await self._index_document(message)
        elif action == "search_documents":
            return await self._search_documents(message)
        elif action == "get_similar_documents":
            return await self._get_similar_documents(message)

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.ERROR,
            payload={"error": f"Unknown action: {action}"},
        )

    async def _answer_query(self, message: Message) -> Message:
        """Answer a user query using RAG (Retrieval-Augmented Generation)"""
        try:
            query = message.payload.get("query", "")
            max_results = message.payload.get("max_results", 5)

            if not query.strip():
                raise ValueError("Query cannot be empty")

            # Step 1: Retrieve relevant documents
            search_results = await self.vector_store.search(query, k=max_results)

            if not search_results:
                return Message(
                    from_agent=self.agent_id,
                    to_agent=message.from_agent,
                    message_type=MessageType.RESPONSE,
                    payload={
                        "answer": "I couldn't find any relevant documents to answer your question.",
                        "confidence": 0.0,
                        "sources": [],
                    },
                )

            # Step 2: Extract answer using QA model
            best_answer = None
            best_confidence = 0.0
            sources = []

            for result in search_results:
                context = result["text"]

                # Use QA model to extract answer
                def get_answer():
                    return self.qa_pipeline(question=query, context=context)

                loop = asyncio.get_event_loop()
                qa_result = await loop.run_in_executor(None, get_answer)

                confidence = qa_result["score"]

                # Keep track of best answer
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_answer = qa_result["answer"]

                # Add source information
                sources.append(
                    {
                        "document_id": result["metadata"].get("document_id"),
                        "chunk_index": result["metadata"].get("chunk_index"),
                        "similarity_score": result["score"],
                        "qa_confidence": confidence,
                        "text_snippet": (
                            context[:200] + "..." if len(context) > 200 else context
                        ),
                    }
                )

            # Step 3: Enhance answer with context
            enhanced_answer = await self._enhance_answer(
                query, best_answer, search_results
            )

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "answer": enhanced_answer,
                    "confidence": best_confidence,
                    "sources": sources,
                    "query": query,
                },
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _index_document(self, message: Message) -> Message:
        """Index a document for search"""
        try:
            document_id = message.payload.get("document_id")
            workflow_id = message.payload.get("workflow_id")
            previous_results = message.payload.get("previous_results", {})

            # Get processed chunks from curator
            curator_result = previous_results.get("document_ingestion", {})
            chunks = curator_result.get("chunks", [])

            if not chunks:
                raise ValueError("No text chunks available for indexing")

            # Prepare documents for vector store
            documents_to_index = []
            for chunk in chunks:
                documents_to_index.append(
                    {
                        "id": f"doc_{document_id}_chunk_{chunk['index']}",
                        "text": chunk["text"],
                        "document_id": str(document_id),
                        "chunk_index": chunk["index"],
                        "source": f"document_{document_id}",
                        "type": "text_chunk",
                    }
                )

            # Add to vector store
            vector_ids = await self.vector_store.add_documents(documents_to_index)

            # Store embedding records in database
            await self._store_embeddings(document_id, chunks, vector_ids)

            result = {
                "document_id": document_id,
                "indexed_chunks": len(chunks),
                "vector_ids": vector_ids,
            }

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "workflow_id": workflow_id,
                    "result": result,
                    "status": "completed",
                    "message": f"Document {document_id} indexed successfully",
                },
            )

        except Exception as e:
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

    async def _search_documents(self, message: Message) -> Message:
        """Search documents by similarity"""
        try:
            query = message.payload.get("query", "")
            max_results = message.payload.get("max_results", 10)

            search_results = await self.vector_store.search(query, k=max_results)

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "search_results": search_results,
                    "query": query,
                    "total_results": len(search_results),
                },
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _get_similar_documents(self, message: Message) -> Message:
        """Find documents similar to a given document"""
        try:
            document_id = message.payload.get("document_id")
            max_results = message.payload.get("max_results", 5)

            # Get document text from database
            async with SessionLocal() as db:
                document = await db.get(Document, document_id)
                if not document:
                    raise ValueError(f"Document {document_id} not found")

                # Get a representative chunk of text
                embeddings = (
                    await db.query(DocumentEmbedding)
                    .filter(DocumentEmbedding.document_id == document_id)
                    .limit(1)
                    .all()
                )

                if not embeddings:
                    raise ValueError(f"No embeddings found for document {document_id}")

                query_text = embeddings[0].text_content

            # Search for similar documents
            search_results = await self.vector_store.search(
                query_text, k=max_results + 5
            )

            # Filter out the same document
            filtered_results = [
                result
                for result in search_results
                if result["metadata"].get("document_id") != str(document_id)
            ][:max_results]

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "similar_documents": filtered_results,
                    "source_document_id": document_id,
                    "total_results": len(filtered_results),
                },
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _enhance_answer(
        self, query: str, answer: str, search_results: List[Dict[str, Any]]
    ) -> str:
        """Enhance the answer with additional context"""
        if not answer:
            return "I couldn't find a specific answer to your question."

        # Add context about confidence and sources
        num_sources = len(search_results)
        avg_similarity = sum(result["score"] for result in search_results) / max(
            num_sources, 1
        )

        enhanced = answer

        if avg_similarity > 0.8:
            enhanced += f"\n\n(This answer is based on {num_sources} highly relevant document sections.)"
        elif avg_similarity > 0.6:
            enhanced += f"\n\n(This answer is based on {num_sources} moderately relevant document sections.)"
        else:
            enhanced += f"\n\n(This answer is based on {num_sources} document sections with limited relevance. The answer may not be fully accurate.)"

        return enhanced

    async def _store_embeddings(
        self, document_id: int, chunks: List[Dict[str, Any]], vector_ids: List[str]
    ):
        """Store embedding records in database"""
        try:
            from app.database import DocumentEmbedding
            from datetime import datetime

            async with SessionLocal() as db:
                for i, (chunk, vector_id) in enumerate(zip(chunks, vector_ids)):
                    embedding_record = DocumentEmbedding(
                        document_id=document_id,
                        chunk_index=chunk["index"],
                        text_content=chunk["text"],
                        embedding_model=settings.SENTENCE_TRANSFORMER_MODEL,
                        vector_id=vector_id,
                        created_date=datetime.utcnow(),
                    )
                    db.add(embedding_record)

                await db.commit()

        except Exception as e:
            print(f"Error storing embeddings: {e}")
