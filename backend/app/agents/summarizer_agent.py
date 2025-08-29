from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent, Message, MessageType
from transformers import pipeline
import asyncio


class SummarizerAgent(BaseAgent):
    def __init__(self):
        super().__init__("summarizer", "summarizer")
        self.summarization_pipeline = None

    async def initialize(self):
        """Initialize summarization model"""

        def load_model():
            self.summarization_pipeline = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                tokenizer="facebook/bart-large-cnn",
            )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, load_model)
        print("Summarizer agent initialized")

    async def cleanup(self):
        """Cleanup resources"""
        self.summarization_pipeline = None

    async def process_message(self, message: Message) -> Optional[Message]:
        """Process summarizer-specific messages"""
        if message.message_type != MessageType.REQUEST:
            return None

        action = message.payload.get("action")

        if action == "summarize_document":
            return await self._summarize_document(message)
        elif action == "summarize_text":
            return await self._summarize_text(message)
        elif action == "generate_insights":
            return await self._generate_insights(message)

        return Message(
            from_agent=self.agent_id,
            to_agent=message.from_agent,
            message_type=MessageType.ERROR,
            payload={"error": f"Unknown action: {action}"},
        )

    async def _summarize_document(self, message: Message) -> Message:
        """Generate comprehensive document summary"""
        try:
            document_id = message.payload.get("document_id")
            workflow_id = message.payload.get("workflow_id")
            previous_results = message.payload.get("previous_results", {})

            # Get processed text from curator
            curator_result = previous_results.get("document_ingestion", {})
            processed_text = curator_result.get("processed_text", "")

            # Get analysis results from analyzer
            analyzer_result = previous_results.get("text_analysis", {})
            analysis_results = analyzer_result.get("analysis_results", {})

            if not processed_text:
                raise ValueError("No processed text available for summarization")

            # Generate different types of summaries
            summaries = {}

            # 1. Extractive summary (key sentences)
            extractive_summary = await self._generate_extractive_summary(processed_text)
            summaries["extractive"] = extractive_summary

            # 2. Abstractive summary (AI-generated)
            abstractive_summary = await self._generate_abstractive_summary(
                processed_text
            )
            summaries["abstractive"] = abstractive_summary

            # 3. Key insights based on analysis
            insights = await self._generate_insights_from_analysis(analysis_results)
            summaries["insights"] = insights

            # 4. Executive summary
            executive_summary = await self._generate_executive_summary(
                processed_text, analysis_results
            )
            summaries["executive"] = executive_summary

            # Calculate summary quality metrics
            quality_metrics = await self._calculate_summary_quality(
                processed_text, summaries
            )

            result = {
                "document_id": document_id,
                "summaries": summaries,
                "quality_metrics": quality_metrics,
                "metadata": {
                    "original_length": len(processed_text),
                    "compression_ratio": len(summaries["abstractive"])
                    / len(processed_text),
                    "summary_types": list(summaries.keys()),
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
                    "message": f"Document {document_id} summarization completed",
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

    async def _summarize_text(self, message: Message) -> Message:
        """Summarize arbitrary text"""
        try:
            text = message.payload.get("text", "")
            summary_type = message.payload.get("summary_type", "abstractive")
            max_length = message.payload.get("max_length", 150)

            if summary_type == "abstractive":
                summary = await self._generate_abstractive_summary(text, max_length)
            else:
                summary = await self._generate_extractive_summary(text)

            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload={
                    "summary": summary,
                    "summary_type": summary_type,
                    "original_length": len(text),
                    "summary_length": len(summary),
                },
            )

        except Exception as e:
            return Message(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.ERROR,
                payload={"error": str(e)},
            )

    async def _generate_abstractive_summary(
        self, text: str, max_length: int = 150
    ) -> str:
        """Generate abstractive summary using BART"""

        def summarize():
            # Split text into chunks if too long
            max_input_length = 1024
            if len(text) > max_input_length:
                # Take first chunk for now (could be improved)
                text_chunk = text[:max_input_length]
            else:
                text_chunk = text

            result = self.summarization_pipeline(
                text_chunk, max_length=max_length, min_length=30, do_sample=False
            )
            return result[0]["summary_text"]

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, summarize)

    async def _generate_extractive_summary(self, text: str) -> str:
        """Generate extractive summary by selecting key sentences"""
        sentences = text.split(". ")

        # Simple extractive approach: take first, middle, and last sentences
        if len(sentences) <= 3:
            return text

        key_sentences = [
            sentences[0],  # First sentence
            sentences[len(sentences) // 2],  # Middle sentence
            sentences[-1],  # Last sentence
        ]

        return ". ".join(key_sentences) + "."

    async def _generate_insights_from_analysis(
        self, analysis_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate insights based on NLP analysis"""
        insights = {}

        # Entity insights
        entities = analysis_results.get("entities", [])
        if entities:
            entity_types = {}
            for entity in entities:
                entity_type = entity.get("label", "UNKNOWN")
                entity_types[entity_type] = entity_types.get(entity_type, 0) + 1

            insights["entity_summary"] = (
                f"Document contains {len(entities)} named entities, "
                f"primarily {max(entity_types, key=entity_types.get)} entities."
            )

        # Sentiment insights
        sentiment = analysis_results.get("sentiment", {})
        if sentiment:
            sentiment_label = sentiment.get("label", "neutral")
            confidence = sentiment.get("confidence", 0)
            insights["sentiment_summary"] = (
                f"Overall sentiment is {sentiment_label} "
                f"(confidence: {confidence:.2f})"
            )

        # Topic insights
        topics = analysis_results.get("topics", [])
        if topics:
            main_topics = [topic.get("topic_words", [])[:3] for topic in topics[:3]]
            insights["topic_summary"] = (
                f"Main topics include: {', '.join([' & '.join(words) for words in main_topics])}"
            )

        return insights

    async def _generate_executive_summary(
        self, text: str, analysis_results: Dict[str, Any]
    ) -> str:
        """Generate executive summary combining content and analysis"""

        # Get abstractive summary
        content_summary = await self._generate_abstractive_summary(text, max_length=100)

        # Add analysis insights
        insights = await self._generate_insights_from_analysis(analysis_results)

        executive_summary = f"EXECUTIVE SUMMARY:\n\n{content_summary}\n\n"

        if insights:
            executive_summary += "KEY INSIGHTS:\n"
            for insight_type, insight_text in insights.items():
                executive_summary += f"• {insight_text}\n"

        return executive_summary

    async def _calculate_summary_quality(
        self, original_text: str, summaries: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate quality metrics for summaries"""
        metrics = {}

        original_length = len(original_text)

        for summary_type, summary_text in summaries.items():
            if isinstance(summary_text, str):
                summary_length = len(summary_text)
                compression_ratio = summary_length / original_length

                metrics[f"{summary_type}_compression"] = compression_ratio
                metrics[f"{summary_type}_length"] = summary_length

        return metrics
