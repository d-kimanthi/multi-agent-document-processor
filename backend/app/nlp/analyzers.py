import asyncio
from typing import List, Dict, Any, Tuple
import spacy
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np


class NLPAnalyzer:
    def __init__(self):
        self.nlp = None
        self.tfidf_vectorizer = None
        self.lda_model = None

    async def initialize(self):
        """Initialize analysis models"""

        def load_models():
            self.nlp = spacy.load("en_core_web_sm")
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000, stop_words="english", ngram_range=(1, 2)
            )

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, load_models)
        print("NLP analyzer models loaded")

    async def cleanup(self):
        """Cleanup resources"""
        self.nlp = None
        self.tfidf_vectorizer = None
        self.lda_model = None

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities from text"""

        def extract_sync():
            doc = self.nlp(text)
            entities = []

            for ent in doc.ents:
                entities.append(
                    {
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "confidence": 1.0,  # spaCy doesn't provide confidence scores
                    }
                )

            return entities

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, extract_sync)

    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment of text"""

        def analyze_sync():
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 to 1
            subjectivity = blob.sentiment.subjectivity  # 0 to 1

            # Convert to categorical sentiment
            if polarity > 0.1:
                sentiment_label = "positive"
                confidence = polarity
            elif polarity < -0.1:
                sentiment_label = "negative"
                confidence = abs(polarity)
            else:
                sentiment_label = "neutral"
                confidence = 1 - abs(polarity)

            return {
                "label": sentiment_label,
                "polarity": polarity,
                "subjectivity": subjectivity,
                "confidence": confidence,
            }

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, analyze_sync)

    async def extract_topics(
        self, texts: List[str], n_topics: int = 5
    ) -> List[Dict[str, Any]]:
        """Extract topics using LDA"""

        def extract_sync():
            if len(texts) < 2:
                return []

            # Vectorize texts
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)

            # Fit LDA model
            self.lda_model = LatentDirichletAllocation(
                n_components=min(n_topics, len(texts)), random_state=42, max_iter=100
            )

            doc_topic_matrix = self.lda_model.fit_transform(tfidf_matrix)

            # Get topic words
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            topics = []

            for topic_idx, topic in enumerate(self.lda_model.components_):
                top_words_idx = topic.argsort()[-10:][::-1]
                top_words = [feature_names[i] for i in top_words_idx]
                top_weights = [topic[i] for i in top_words_idx]

                topics.append(
                    {
                        "topic_id": topic_idx,
                        "topic_words": top_words,
                        "topic_weights": top_weights,
                        "coherence_score": np.mean(top_weights),
                    }
                )

            return topics

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, extract_sync)

    async def extract_keywords(
        self, text: str, top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Extract keywords using TF-IDF"""

        def extract_sync():
            # Simple keyword extraction using spaCy
            doc = self.nlp(text)

            # Get noun phrases and important tokens
            candidates = []

            # Add noun phrases
            for chunk in doc.noun_chunks:
                if len(chunk.text.split()) <= 3:  # Limit phrase length
                    candidates.append(chunk.text.lower())

            # Add important single tokens
            for token in doc:
                if (
                    token.pos_ in ["NOUN", "ADJ"]
                    and not token.is_stop
                    and not token.is_punct
                    and len(token.text) > 2
                ):
                    candidates.append(token.text.lower())

            # Count frequency
            keyword_freq = {}
            for candidate in candidates:
                keyword_freq[candidate] = keyword_freq.get(candidate, 0) + 1

            # Sort by frequency and return top k
            sorted_keywords = sorted(
                keyword_freq.items(), key=lambda x: x[1], reverse=True
            )

            return [
                {"keyword": kw, "frequency": freq, "score": freq / len(candidates)}
                for kw, freq in sorted_keywords[:top_k]
            ]

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, extract_sync)
