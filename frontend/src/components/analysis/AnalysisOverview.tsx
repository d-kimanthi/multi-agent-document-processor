import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Document } from '@/types'
import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface AnalysisOverviewProps {
  documents: Document[]
  analysisData?: any
  isLoading: boolean
}

export const AnalysisOverview: React.FC<AnalysisOverviewProps> = ({
  documents,
  analysisData,
  isLoading
}) => {
  const statusData = React.useMemo(() => {
    const statusCounts = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      completed: '#10b981',
      processing: '#f59e0b',
      uploaded: '#6b7280',
      error: '#ef4444',
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280',
    }))
  }, [documents])

  const sizeDistribution = React.useMemo(() => {
    const sizeRanges = [
      { label: '< 1MB', min: 0, max: 1024 * 1024 },
      { label: '1-5MB', min: 1024 * 1024, max: 5 * 1024 * 1024 },
      { label: '5-10MB', min: 5 * 1024 * 1024, max: 10 * 1024 * 1024 },
      { label: '> 10MB', min: 10 * 1024 * 1024, max: Infinity },
    ]

    return sizeRanges.map(range => ({
      name: range.label,
      count: documents.filter(doc => 
        doc.file_size >= range.min && doc.file_size < range.max
      ).length
    }))
  }, [documents])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Document Status Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          {statusData.map((entry, index) => (
            <div key={index} className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* File Size Distribution */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">File Size Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Processing Performance */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(documents.reduce((sum, doc) => sum + doc.file_size, 0) / (1024 * 1024)).toFixed(1)}MB
            </div>
            <div className="text-sm text-gray-600">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Successfully Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round((documents.filter(d => d.status === 'completed').length / documents.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(documents.reduce((sum, doc) => sum + doc.file_size, 0) / (1024 * 1024) / documents.length).toFixed(1)}MB
            </div>
            <div className="text-sm text-gray-600">Average Size</div>
          </div>
        </div>
      </div>
    </div>
  )
}