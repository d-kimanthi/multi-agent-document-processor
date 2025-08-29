import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { analysisApi } from '@/services/api'
import { Document } from '@/types'
import React from 'react'
import { useQueries } from 'react-query'
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'

interface ComparisonChartProps {
  documentIds: number[]
  documents: Document[]
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ documentIds, documents }) => {
  const analysisQueries = useQueries(
    documentIds.map(id => ({
      queryKey: ['analysis', id],
      queryFn: () => analysisApi.getDocumentAnalysis(id),
      enabled: true,
    }))
  )

  const isLoading = analysisQueries.some(query => query.isLoading)
  const hasError = analysisQueries.some(query => query.error)

  const comparisonData = React.useMemo(() => {
    if (isLoading || hasError) return []

    const metrics = ['Entities', 'Keywords', 'Topics', 'Sentiment Score']
    
    return metrics.map(metric => {
      const dataPoint: any = { metric }
      
      analysisQueries.forEach((query, index) => {
        if (query.data) {
          const doc = documents.find(d => d.id === documentIds[index])
          const docName = doc?.filename.split('.')[0].substring(0, 15) || `Doc ${index + 1}`
          
          let value = 0
          switch (metric) {
            case 'Entities':
              value = query.data.analysis_results.entities?.length || 0
              break
            case 'Keywords':
              value = query.data.analysis_results.keywords?.length || 0
              break
            case 'Topics':
              value = query.data.analysis_results.topics?.length || 0
              break
            case 'Sentiment Score':
              value = Math.abs(query.data.analysis_results.sentiment?.polarity || 0) * 100
              break
          }
          
          dataPoint[docName] = value
        }
      })
      
      return dataPoint
    })
  }, [analysisQueries, documentIds, documents, isLoading, hasError])

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading comparison data...</span>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="card">
        <div className="text-center py-8 text-red-600">
          Failed to load comparison data
        </div>
      </div>
    )
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Comparison</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={comparisonData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis />
            {documentIds.map((_, index) => {
              const doc = documents.find(d => d.id === documentIds[index])
              const docName = doc?.filename.split('.')[0].substring(0, 15) || `Doc ${index + 1}`
              return (
                <Radar
                  key={index}
                  name={docName}
                  dataKey={docName}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.1}
                />
              )
            })}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
