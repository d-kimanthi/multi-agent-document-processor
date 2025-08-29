import re
import asyncio
from typing import List, Dict, Any
import spacy
from sentence_transformers import SentenceTransformer
import numpy as np

class TextProcessor:
    def __init__(self):
        self.nlp = None
        self.sentence_model = None
        
    async def initialize(self):
        """Initialize NLP models"""
        def load_models():
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
            
            # Load sentence transformer for embeddings
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            
        # Load models in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, load_models)
        print("Text processor models loaded")
        
    async def cleanup(self):
        """Cleanup resources"""
        self.nlp = None
        self.sentence_model = None
        
    async def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep sentence structure
        text = re.sub(r'[^\w\s\.\!\?\,\;\:\-\(\)]', '', text)
        
        # Normalize quotes
        text = re.sub(r'["""]', '"', text)
        text = re.sub(r'[''']', "'", text)
        
        return text.strip()
        
    async def create_chunks(self, text: str, max_chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks"""
        def chunk_text():
            doc = self.nlp(text)
            sentences = [sent.text for sent in doc.sents]
            
            chunks = []
            current_chunk = ""
            current_size = 0
            chunk_index = 0
            
            for sentence in sentences:
                sentence_size = len(sentence)
                
                if current_size + sentence_size > max_chunk_size and current_chunk:
                    # Create chunk
                    chunks.append({
                        "index": chunk_index,
                        "text": current_chunk.strip(),
                        "start_pos": len(''.join([c["text"] for c in chunks])),
                        "end_pos": len(''.join([c["text"] for c in chunks])) + len(current_chunk)
                    })
                    chunk_index += 1
                    
                    # Start new chunk with overlap
                    if overlap > 0:
                        overlap_text = current_chunk[-overlap:]
                        current_chunk = overlap_text + " " + sentence
                        current_size = len(overlap_text) + sentence_size + 1
                    else:
                        current_chunk = sentence
                        current_size = sentence_size
                else:
                    current_chunk += " " + sentence if current_chunk else sentence
                    current_size += sentence_size + (1 if current_chunk else 0)
            
            # Add final chunk
            if current_chunk:
                chunks.append({
                    "index": chunk_index,
                    "text": current_chunk.strip(),
                    "start_pos": len(''.join([c["text"] for c in chunks])),
                    "end_pos": len(''.join([c["text"] for c in chunks])) + len(current_chunk)
                })
                
            return chunks
            
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, chunk_text)
        
    async def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for text chunks"""
        def encode_texts():
            return self.sentence_model.encode(texts)
            
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, encode_texts)
