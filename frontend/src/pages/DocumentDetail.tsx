import { EntityVisualization } from '@/components/analysis/EntityVisualization'
import { KeywordList } from '@/components/analysis/KeywordList'
import { SentimentDisplay } from '@/components/analysis/SentimentDisplay'
import { TopicCloud } from '@/components/analysis/TopicCloud'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useDocumentAnalysis } from '@/hooks/useAnalysis'
import { useDocument } from '@/hooks/useDocuments'
import { classNames } from '@/utils/classNames'
import {
    ArrowLeftIcon,
    ChartBarIcon,
    ChatBubbleLeftIcon,
    DocumentTextIcon,
    HeartIcon,
    TagIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import { Link, useParams } from 'react-router-dom'

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const documentId = parseInt(id!, 10)
  
  const { data: document, isLoading: documentLoading, error: documentError } = useDocument(documentId)
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useDocumentAnalysis(documentId)

  if (documentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (documentError || !document) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Document not found</div>
        <Link to="/documents" className="btn-primary">
          Back to Documents
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed'
      case 'processing':
        return 'status-processing'
      case 'error':
        return 'status-error'
      default:
        return 'status-uploaded'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/documents"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{formatFileSize(document.file_size)}</span>
              <span>{document.mime_type}</span>
              <span>
                Uploaded {formatDistanceToNow(new Date(document.upload_date), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <span className={classNames('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(document.status))}>
          {document.status}
        </span>
      </div>

      {/* Document Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Filename</p>
                  <p className="text-sm text-gray-900">{document.filename}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Size</p>
                  <p className="text-sm text-gray-900">{formatFileSize(document.file_size)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <TagIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-900">{document.mime_type}</p>
                </div>
              </div>
            </div>

            {document.processed_date && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Processed {formatDistanceToNow(new Date(document.processed_date), { addSuffix: true })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          {analysisLoading ? (
            <div className="card">
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading analysis results...</span>
              </div>
            </div>
          ) : analysisError ? (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {document.status === 'processing' 
                    ? 'Document is still being processed. Analysis results will appear here when ready.'
                    : 'Analysis results not available for this document.'}
                </p>
                {document.status === 'processing' && (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Sentiment Analysis */}
              <div className="card">
                <div className="flex items-center mb-4">
                  <HeartIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h3>
                </div>
                <SentimentDisplay sentiment={analysis.analysis_results.sentiment} />
              </div>

              {/* Named Entities */}
              {analysis.analysis_results.entities.length > 0 && (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Named Entities</h3>
                  </div>
                  <EntityVisualization entities={analysis.analysis_results.entities} />
                </div>
              )}

              {/* Keywords */}
              {analysis.analysis_results.keywords.length > 0 && (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Keywords</h3>
                  </div>
                  <KeywordList keywords={analysis.analysis_results.keywords} />
                </div>
              )}

              {/* Topics */}
              {analysis.analysis_results.topics.length > 0 && (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Topics</h3>
                  </div>
                  <TopicCloud topics={analysis.analysis_results.topics} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
