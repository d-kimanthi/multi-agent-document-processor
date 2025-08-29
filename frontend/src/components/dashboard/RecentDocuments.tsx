import { Document } from '@/types'
import { classNames } from '@/utils/classNames'
import { ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import { Link } from 'react-router-dom'

interface RecentDocumentsProps {
  documents: Document[]
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({ documents }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
        <Link
          to="/documents"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
        >
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((document) => (
            <Link
              key={document.id}
              to={`/documents/${document.id}`}
              className="block hover:bg-gray-50 rounded-lg p-3 transition-colors duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(document.upload_date), { addSuffix: true })}
                  </p>
                </div>
                <span
                  className={classNames(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(document.status)
                  )}
                >
                  {document.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}