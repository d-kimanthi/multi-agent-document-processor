import { AnalysisOverview } from '@/components/analysis/AnalysisOverview'
import { ComparisonChart } from '@/components/analysis/ComparisonChart'
import { TrendAnalysis } from '@/components/analysis/TrendAnalysis'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useDocuments } from '@/hooks/useDocuments'
import { analysisApi } from '@/services/api'
import { classNames } from '@/utils/classNames'
import {
    ArrowDownTrayIcon,
    ChartBarIcon,
    DocumentTextIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline'
import React, { useState } from 'react'
import { useQuery } from 'react-query'

type ViewType = 'overview' | 'comparison' | 'trends'

export const Analysis: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])
  
  const { data: documents, isLoading: documentsLoading } = useDocuments()
  
  const { data: analysisData, isLoading: analysisLoading } = useQuery(
    'analysis-summary',
    () => analysisApi.getAnalysisSummary(),
    {
      enabled: !!documents && documents.length > 0
    }
  )

  const completedDocuments = documents?.filter(doc => doc.status === 'completed') || []

  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const exportAnalysis = () => {
    // Create a simple CSV export of analysis results
    const csvData = completedDocuments.map(doc => ({
      filename: doc.filename,
      upload_date: doc.upload_date,
      file_size: doc.file_size,
      status: doc.status
    }))
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document_analysis.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (documentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Analysis</h1>
          <p className="text-gray-600">Comprehensive analysis and insights from your document corpus</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportAnalysis}
            className="btn-secondary"
            disabled={completedDocuments.length === 0}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <DocumentTextIcon className="mx-auto h-8 w-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {documents?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        
        <div className="card text-center">
          <ChartBarIcon className="mx-auto h-8 w-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {completedDocuments.length}
          </div>
          <div className="text-sm text-gray-600">Analyzed</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {documents?.filter(d => d.status === 'processing').length || 0}
          </div>
          <div className="text-sm text-gray-600">Processing</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {documents?.filter(d => d.status === 'error').length || 0}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {completedDocuments.length === 0 ? (
        <div className="card text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload and process some documents to see analysis results here.
          </p>
        </div>
      ) : (
        <>
          {/* View Selector */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'comparison', label: 'Document Comparison', icon: FunnelIcon },
              { key: 'trends', label: 'Trends', icon: ChartBarIcon },
            ].map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key as ViewType)}
                  className={classNames(
                    'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    currentView === view.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {view.label}
                </button>
              )
            })}
          </div>

          {/* View Content */}
          <div className="space-y-6">
            {currentView === 'overview' && (
              <AnalysisOverview 
                documents={completedDocuments}
                analysisData={analysisData}
                isLoading={analysisLoading}
              />
            )}

            {currentView === 'comparison' && (
              <div className="space-y-6">
                {/* Document Selector */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Documents to Compare
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {completedDocuments.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => handleDocumentToggle(doc.id)}
                          className="mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedDocuments.length > 1 && (
                  <ComparisonChart 
                    documentIds={selectedDocuments}
                    documents={completedDocuments}
                  />
                )}

                {selectedDocuments.length <= 1 && (
                  <div className="card text-center py-8">
                    <p className="text-gray-500">
                      Select at least 2 documents to compare their analysis results
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentView === 'trends' && (
              <TrendAnalysis documents={completedDocuments} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
