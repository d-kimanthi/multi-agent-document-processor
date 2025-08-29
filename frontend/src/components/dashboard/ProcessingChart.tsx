import { Document } from '@/types'
import { format, startOfDay, subDays } from 'date-fns'
import React from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

interface ProcessingChartProps {
  documents: Document[]
}

export const ProcessingChart: React.FC<ProcessingChartProps> = ({ documents }) => {
  // Generate data for the last 7 days
  const chartData = React.useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i))
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        uploaded: 0,
        processed: 0,
        errors: 0,
      }
    })

    documents.forEach((doc) => {
      const uploadDate = startOfDay(new Date(doc.upload_date))
      const dayIndex = days.findIndex(day => 
        day.fullDate.getTime() === uploadDate.getTime()
      )
      
      if (dayIndex !== -1) {
        days[dayIndex].uploaded += 1
        
        if (doc.status === 'completed') {
          days[dayIndex].processed += 1
        } else if (doc.status === 'error') {
          days[dayIndex].errors += 1
        }
      }
    })

    return days
  }, [documents])

  if (documents.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No processing data available</p>
          <p className="text-sm">Upload some documents to see activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="uploaded"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            name="Uploaded"
          />
          <Line
            type="monotone"
            dataKey="processed"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            name="Processed"
          />
          <Line
            type="monotone"
            dataKey="errors"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            name="Errors"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}