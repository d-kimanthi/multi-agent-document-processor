import { AnalysisResult, Document, QueryResponse, SystemStatus, WorkflowStatus } from '@/types';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const documentApi = {
  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents/');
    return response.data;
  },

  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  reprocessDocument: async (id: number): Promise<void> => {
    await api.post(`/documents/${id}/reprocess`);
  },
};

export const analysisApi = {
  getDocumentAnalysis: async (documentId: number): Promise<AnalysisResult> => {
    const response = await api.get(`/analysis/${documentId}`);
    return response.data;
  },

  getDocumentEntities: async (documentId: number) => {
    const response = await api.get(`/analysis/${documentId}/entities`);
    return response.data;
  },

  getDocumentSentiment: async (documentId: number) => {
    const response = await api.get(`/analysis/${documentId}/sentiment`);
    return response.data;
  },

  getDocumentTopics: async (documentId: number) => {
    const response = await api.get(`/analysis/${documentId}/topics`);
    return response.data;
  },

  analyzeText: async (text: string, analysisType: string = 'all') => {
    const response = await api.post('/analysis/analyze-text', {
      text,
      analysis_type: analysisType,
    });
    return response.data;
  },
};

export const queryApi = {
  askQuestion: async (query: string, maxResults: number = 5): Promise<QueryResponse> => {
    const response = await api.post('/query/ask', {
      query,
      max_results: maxResults,
    });
    return response.data;
  },

  searchDocuments: async (query: string, maxResults: number = 10) => {
    const response = await api.post('/query/search', {
      query,
      max_results: maxResults,
    });
    return response.data;
  },

  getSimilarDocuments: async (documentId: number, maxResults: number = 5) => {
    const response = await api.get(`/query/${documentId}/similar`, {
      params: { max_results: maxResults },
    });
    return response.data;
  },
};

export const agentApi = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    const response = await api.get('/agents/status');
    return response.data;
  },

  getMessageHistory: async (limit: number = 100) => {
    const response = await api.get('/agents/messages', {
      params: { limit },
    });
    return response.data;
  },

  getWorkflows: async (): Promise<{ workflows: WorkflowStatus[] }> => {
    const response = await api.get('/agents/workflows');
    return response.data;
  },

  getMetrics: async () => {
    const response = await api.get('/agents/metrics');
    return response.data;
  },

  restartAgent: async (agentId: string) => {
    const response = await api.post(`/agents/agents/${agentId}/restart`);
    return response.data;
  },
};

export default api;
