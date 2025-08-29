import { analysisApi } from '@/services/api'
import { useQuery } from 'react-query'

export const useDocumentAnalysis = (documentId: number) => {
  return useQuery(
    ['analysis', documentId],
    () => analysisApi.getDocumentAnalysis(documentId),
    {
      enabled: !!documentId,
      retry: (failureCount, error: any) => {
        // Don't retry if document is still processing
        if (error?.response?.status === 202) {
          return false
        }
        return failureCount < 2
      },
    }
  )
}

export const useDocumentEntities = (documentId: number) => {
  return useQuery(
    ['entities', documentId],
    () => analysisApi.getDocumentEntities(documentId),
    {
      enabled: !!documentId,
    }
  )
}

export const useDocumentSentiment = (documentId: number) => {
  return useQuery(
    ['sentiment', documentId],
    () => analysisApi.getDocumentSentiment(documentId),
    {
      enabled: !!documentId,
    }
  )
}

export const useDocumentTopics = (documentId: number) => {
  return useQuery(
    ['topics', documentId],
    () => analysisApi.getDocumentTopics(documentId),
    {
      enabled: !!documentId,
    }
  )
}