export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// src/hooks/useDocuments.ts
import { documentApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from 'react-query'

export const useDocuments = () => {
  return useQuery('documents', documentApi.getDocuments, {
    staleTime: 30000, // 30 seconds
  })
}

export const useDocument = (id: number) => {
  return useQuery(['document', id], () => documentApi.getDocument(id), {
    enabled: !!id,
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation(documentApi.uploadDocument, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('documents')
      toast.success(`Document "${data.filename}" uploaded successfully!`)
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.response?.data?.detail || error.message}`)
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation(documentApi.deleteDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents')
      toast.success('Document deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.response?.data?.detail || error.message}`)
    },
  })
}

export const useReprocessDocument = () => {
  const queryClient = useQueryClient()

  return useMutation(documentApi.reprocessDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents')
      toast.success('Document queued for reprocessing!')
    },
    onError: (error: any) => {
      toast.error(`Reprocess failed: ${error.response?.data?.detail || error.message}`)
    },
  })
}
