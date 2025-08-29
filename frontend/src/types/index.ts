export interface Document {
  id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  processed_date?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
}

export interface AnalysisResult {
  document_id: number;
  analysis_results: {
    entities: NamedEntity[];
    sentiment: SentimentResult;
    keywords: Keyword[];
    topics: Topic[];
  };
  confidence_scores: Record<string, number>;
}

export interface NamedEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  polarity: number;
  subjectivity: number;
  confidence: number;
}

export interface Keyword {
  keyword: string;
  frequency: number;
  score: number;
}

export interface Topic {
  topic_id: number;
  topic_words: string[];
  topic_weights: number[];
  coherence_score: number;
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  sources: QuerySource[];
  query: string;
  processing_time_ms?: number;
}

export interface QuerySource {
  document_id: number;
  chunk_index: number;
  similarity_score: number;
  text_snippet: string;
}

export interface AgentStatus {
  agent_id: string;
  agent_type: string;
  status: 'idle' | 'busy' | 'error' | 'stopped';
  metrics: {
    messages_processed: number;
    errors: number;
    processing_time: number;
  };
  queue_size: number;
}

export interface SystemStatus {
  system_status: string;
  agents: Record<string, AgentStatus>;
  active_workflows: number;
  message_history_size: number;
}

export interface WorkflowStatus {
  workflow_id: string;
  document_id: string;
  status: string;
  current_step: string;
  results: Record<string, any>;
  error_messages: Array<{
    agent: string;
    error: string;
    step: string;
  }>;
  started_at?: string;
  completed_at?: string;
}