import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useDeleteDocument, useDocuments, useReprocessDocument } from '@/hooks/useDocuments'
import { classNames } from '@/utils/classNames'
import {
    ArrowPathIcon,
    DocumentTextIcon,
    EyeIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export const Documents: React.FC = () => {
  const { data: documents, isLoading, error } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const reprocessDocument = useReprocessDocument()
  const [filter, setFilter] = useState<string>('all')

  const filteredDocuments = React.useMemo(() => {
    if (!documents) return []
    if (filter === 'all') return documents
    return documents.filter(doc => doc.status === filter)
  }, [documents, filter])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load documents</div>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your uploaded documents and view their processing status</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Document
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'uploaded', label: 'Uploaded' },
          { key: 'processing', label: 'Processing' },
          { key: 'completed', label: 'Completed' },
          { key: 'error', label: 'Error' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={classNames(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.label}
            {tab.key !== 'all' && documents && (
              <span className="ml-1 text-xs text-gray-500">
                ({documents.filter(d => d.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Get started by uploading a document.' 
              : `No documents with status "${filter}".`}
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <Link to="/upload" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload your first document
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => (
              <li key={document.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.filename}
                        </p>
                        <div className="ml-2 flex-shrink-0">
                          <span className={classNames('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(document.status))}>
                            {document.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{document.mime_type}</span>
                        <span>
                          Uploaded {formatDistanceToNow(new Date(document.upload_date), { addSuffix: true })}
                        </span>
                        {document.processed_date && (
                          <span>
                            Processed {formatDistanceToNow(new Date(document.processed_date), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex items-center space-x-2">
                    <Link
                      to={`/documents/${document.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    
                    <button
                      onClick={() => reprocessDocument.mutate(document.id)}
                      disabled={reprocessDocument.isLoading}
                      className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="Reprocess document"
                    >
                      <ArrowPathIcon className={classNames(
                        'h-5 w-5',
                        reprocessDocument.isLoading ? 'animate-spin' : ''
                      )} />
                    </button>

                    <button
                      onClick={() => deleteDocument.mutate(document.id)}
                      disabled={deleteDocument.isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                      title="Delete document"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Stats */}
      {documents && documents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {documents.filter(d => d.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}