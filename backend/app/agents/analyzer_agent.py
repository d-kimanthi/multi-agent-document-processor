from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent, Message, MessageType
from app.nlp.analyzers import NLPAnalyzer
from app.database import SessionLocal, AnalysisResult
from datetime import datetime


class AnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__("analyzer", "analyzer")
        self.analyzer = None

    async def initialize(self):
        """Initialize NLP analyzer"""
        self.analyzer = NLPAnalyzer()
        await self.analyzer.initialize()
        print("Analyzer agent initialized")

    async def cleanup(self):
        """Cleanup resources"""
        if self.analyzer:
            await self.analyzer.cleanup()

    async def process_message(self, message: Message) -> Optional[Message]:
        """Process analyzer-specific messages"""
        if message.message_type != MessageType.REQUEST:
            return None

        action = message.payload.get("action")

        if action == "analyze_document":
            return await self._analyze_document(message)
        elif action == "analyze_text":
            return await self._analyze_text(message)
        elif action == "extract_entities":
            return await self._extract_entities(message)

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.ERROR,
            payload={"error": f"Unknown action: {action}"},
        )

    async def _analyze_document(self, message: Message) -> Message:
        """Perform comprehensive document analysis"""
        try:
            document_id = message.payload.get("document_id")
            workflow_id = message.payload.get("workflow_id")
            previous_results = message.payload.get("previous_results", {})

            # Get processed text from curator results
            curator_result = previous_results.get("document_ingestion", {})
            processed_text = curator_result.get("processed_text", "")
            chunks = curator_result.get("chunks", [])

            if not processed_text:
                raise ValueError("No processed text available from curator")

            # Perform all NLP analyses
            analysis_results = {}

            # 1. Named Entity Recognition
            entities = await self.analyzer.extract_entities(processed_text)
            analysis_results["entities"] = entities

            # 2. Sentiment Analysis
            sentiment = await self.analyzer.analyze_sentiment(processed_text)
            analysis_results["sentiment"] = sentiment

            # 3. Keyword Extraction
            keywords = await self.analyzer.extract_keywords(processed_text)
            analysis_results["keywords"] = keywords

            # 4. Topic Modeling (if we have chunks)
            if len(chunks) > 1:
                chunk_texts = [chunk["text"] for chunk in chunks]
                topics = await self.analyzer.extract_topics(chunk_texts)
                analysis_results["topics"] = topics
            else:
                analysis_results["topics"] = []

            # 5. Calculate analysis confidence scores
            confidence_scores = {
                "entities": sum(ent.get("confidence", 0) for ent in entities)
                / max(len(entities), 1),
                "sentiment": sentiment.get("confidence", 0),
                "keywords": sum(kw.get("score", 0) for kw in keywords)
                / max(len(keywords), 1),
                "topics": sum(
                    topic.get("coherence_score", 0)
                    for topic in analysis_results["topics"]
                )
                / max(len(analysis_results["topics"]), 1),
                "overall": 0.0,
            }
            confidence_scores["overall"] = sum(confidence_scores.values()) / 4

            # Store analysis results in database
            await self._store_analysis_results(
                document_id, analysis_results, confidence_scores
            )

            # Prepare result for next agent
            result = {
                "document_id": document_id,
                "analysis_results": analysis_results,
                "confidence_scores": confidence_scores,
                "metadata": {
                    "entities_count": len(entities),
                    "unique_entities": len(set(ent["text"] for ent in entities)),
                    "sentiment_polarity": sentiment.get("polarity", 0),
                    "keyword_count": len(keywords),
                    "topic_count": len(analysis_results["topics"]),
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
                    "message": f"Document {document_id} analysis completed",
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

    async def _analyze_text(self, message: Message) -> Message:
        """Analyze arbitrary text (not part of document workflow)"""
        try:
            text = message.payload.get("text", "")
            analysis_type = message.payload.get("analysis_type", "all")

            results = {}

            if analysis_type in ["all", "entities"]:
                results["entities"] = await self.analyzer.extract_entities(text)

            if analysis_type in ["all", "sentiment"]:
                results["sentiment"] = await self.analyzer.analyze_sentiment(text)

            if analysis_type in ["all", "keywords"]:
                results["keywords"] = await self.analyzer.extract_keywords(text)

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={"analysis_results": results},
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _extract_entities(self, message: Message) -> Message:
        """Extract entities from text"""
        try:
            text = message.payload.get("text", "")
            entities = await self.analyzer.extract_entities(text)

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={"entities": entities},
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _store_analysis_results(
        self,
        document_id: int,
        analysis_results: Dict[str, Any],
        confidence_scores: Dict[str, float],
    ):
        """Store analysis results in database"""
        try:
            async with SessionLocal() as db:
                # Store each analysis type separately
                for analysis_type, result_data in analysis_results.items():
                    analysis_record = AnalysisResult(
                        document_id=document_id,
                        analysis_type=analysis_type,
                        result_data=result_data,
                        confidence_score=confidence_scores.get(analysis_type, 0.0),
                        agent_id=self.agent_id,
                        created_date=datetime.utcnow(),
                    )
                    db.add(analysis_record)

                await db.commit()

        except Exception as e:
            print(f"Error storing analysis results: {e}")
            # Don't fail the workflow for database errors
