import { AgentActivityChart } from '@/components/dashboard/AgentActivityChart'
import { ProcessingChart } from '@/components/dashboard/ProcessingChart'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { SystemHealth } from '@/components/dashboard/SystemHealth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatsCard } from '@/components/ui/StatsCard'
import { agentApi, documentApi } from '@/services/api'
import {
    ChartBarIcon,
    ClockIcon,
    CpuChipIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    TrendingUpIcon,
} from '@heroicons/react/24/outline'
import React from 'react'
import { useQuery } from 'react-query'

export const Dashboard: React.FC = () => {
  const { data: documents, isLoading: documentsLoading } = useQuery(
    'documents',
    documentApi.getDocuments
  )
  
  const { data: systemStatus, isLoading: statusLoading } = useQuery(
    'systemStatus',
    agentApi.getSystemStatus,
    { refetchInterval: 10000 }
  )
  
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'metrics',
    agentApi.getMetrics,
    { refetchInterval: 15000 }
  )

  const { data: workflows } = useQuery(
    'workflows',
    agentApi.getWorkflows,
    { refetchInterval: 5000 }
  )

  if (documentsLoading || statusLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Documents',
      value: documents?.length || 0,
      icon: DocumentTextIcon,
      color: 'blue',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Completed Analysis',
      value: documents?.filter(d => d.status === 'completed').length || 0,
      icon: ChartBarIcon,
      color: 'green',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Agents',
      value: systemStatus ? Object.values(systemStatus.agents).filter(a => a.status !== 'stopped').length : 0,
      icon: CpuChipIcon,
      color: 'purple',
      change: systemStatus?.system_status === 'operational' ? 'All Online' : 'Issues Detected',
      changeType: systemStatus?.system_status === 'operational' ? 'positive' : 'negative' as const,
    },
    {
      title: 'Processing Queue',
      value: documents?.filter(d => d.status === 'processing').length || 0,
      icon: ClockIcon,
      color: 'yellow',
      change: workflows?.workflows?.length ? `${workflows.workflows.length} workflows` : 'Idle',
      changeType: 'neutral' as const,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to Document Intelligence Platform
            </h1>
            <p className="text-primary-100 text-lg">
              Multi-agent NLP system for intelligent document processing and analysis
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 rounded-lg p-4">
              <TrendingUpIcon className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* System Status Alert */}
      {systemStatus?.system_status !== 'operational' && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mr-2" />
            <span className="text-warning-800 font-medium">
              System Status: {systemStatus?.system_status}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          {/* Processing Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Document Processing Timeline
            </h3>
            <ProcessingChart documents={documents || []} />
          </div>

          {/* Agent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agent Activity
            </h3>
            <AgentActivityChart metrics={metrics} />
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-8">
          {/* System Health */}
          <SystemHealth systemStatus={systemStatus} />

          {/* Recent Documents */}
          <RecentDocuments documents={documents?.slice(0, 5) || []} />
        </div>
      </div>
    </div>
  )
}
