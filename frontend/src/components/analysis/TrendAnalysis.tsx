import { Document } from '@/types'
import { format, startOfDay, subDays } from 'date-fns'
import React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface TrendAnalysisProps {
  documents: Document[]
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ documents }) => {
  const trendData = React.useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 13 - i))
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        uploads: 0,
        processed: 0,
        cumulativeTotal: 0,
      }
    })

    let cumulativeTotal = 0
    documents.forEach((doc) => {
      const uploadDate = startOfDay(new Date(doc.upload_date))
      const dayIndex = days.findIndex(day => 
        day.fullDate.getTime() <= uploadDate.getTime()
      )
      
      if (dayIndex !== -1) {
        // Add to the last applicable day for cumulative count
        for (let i = dayIndex; i < days.length; i++) {
          if (days[i].fullDate.getTime() <= uploadDate.getTime()) {
            days[i].uploads += 1
            if (doc.status === 'completed') {
              days[i].processed += 1
            }
          }
        }
      }
    })

    // Calculate cumulative totals
    days.forEach((day, index) => {
      cumulativeTotal += day.uploads
      day.cumulativeTotal = cumulativeTotal
    })

    return days
  }, [documents])

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Trends (Last 14 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
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
                dataKey="cumulativeTotal"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Cumulative Uploads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}