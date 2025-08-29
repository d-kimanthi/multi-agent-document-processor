import React from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface AgentActivityChartProps {
  metrics?: any
}

export const AgentActivityChart: React.FC<AgentActivityChartProps> = ({ metrics }) => {
  const agentData = React.useMemo(() => {
    if (!metrics?.agent_metrics) return []

    return Object.entries(metrics.agent_metrics).map(([agentId, agentMetrics]: [string, any]) => ({
      name: agentId.charAt(0).toUpperCase() + agentId.slice(1),
      messages: agentMetrics.metrics.messages_processed,
      errors: agentMetrics.metrics.errors,
      avgTime: agentMetrics.metrics.processing_time,
      status: agentMetrics.status,
    }))
  }, [metrics])

  const statusData = React.useMemo(() => {
    if (!agentData.length) return []

    const statusCounts = agentData.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      idle: '#10b981',
      busy: '#3b82f6',
      error: '#ef4444',
      stopped: '#6b7280',
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280',
    }))
  }, [agentData])

  if (!metrics || agentData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No agent activity data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Messages Processed */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Messages Processed</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Status Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Status</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-2">
          {statusData.map((entry, index) => (
            <div key={index} className="flex items-center text-xs">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
