import { AgentStatusCard } from '@/components/agents/AgentStatusCard'
import { MessageHistory } from '@/components/agents/MessageHistory'
import { MetricsDashboard } from '@/components/agents/MetricsDashboard'
import { WorkflowMonitor } from '@/components/agents/WorkflowMonitor'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useMessageHistory, useMetrics, useRestartAgent, useSystemStatus, useWorkflows } from '@/hooks/useAgents'
import { classNames } from '@/utils/classNames'
import {
    ArrowPathIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import React, { useState } from 'react'

type TabType = 'overview' | 'messages' | 'workflows' | 'metrics'

export const Agents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useSystemStatus()
  const { data: messageHistory, isLoading: messagesLoading } = useMessageHistory(100)
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows()
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const restartAgent = useRestartAgent()

  const tabs = [
    { key: 'overview', label: 'System Overview', icon: CpuChipIcon },
    { key: 'messages', label: 'Message History', icon: ChatBubbleLeftRightIcon },
    { key: 'workflows', label: 'Active Workflows', icon: ClockIcon },
    { key: 'metrics', label: 'Performance Metrics', icon: ChartBarIcon },
  ]

  const refreshData = () => {
    window.location.reload()
  }

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading agent system...</span>
      </div>
    )
  }

  if (statusError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Failed to connect to agent system
        </div>
        <p className="text-gray-500 mb-4">
          The agent monitoring system is currently unavailable.
        </p>
        <button
          onClick={refreshData}
          className="btn-primary"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Monitoring</h1>
          <p className="text-gray-600">Monitor and manage the multi-agent system</p>
        </div>
        <button
          onClick={refreshData}
          className="btn-secondary"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* System Status Alert */}
      {systemStatus && systemStatus.system_status !== 'operational' && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mr-2" />
            <span className="text-warning-800 font-medium">
              System Status: {systemStatus.system_status}
            </span>
            <button
              onClick={refreshData}
              className="ml-auto btn-warning text-sm"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <CpuChipIcon className="mx-auto h-8 w-8 text-primary-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {systemStatus ? Object.keys(systemStatus.agents).length : 0}
          </div>
          <div className="text-sm text-gray-600">Total Agents</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {systemStatus 
              ? Object.values(systemStatus.agents).filter(a => a.status === 'idle' || a.status === 'busy').length 
              : 0}
          </div>
          <div className="text-sm text-gray-600">Active Agents</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {systemStatus ? systemStatus.active_workflows : 0}
          </div>
          <div className="text-sm text-gray-600">Active Workflows</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {systemStatus ? systemStatus.message_history_size : 0}
          </div>
          <div className="text-sm text-gray-600">Messages Processed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={classNames(
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
                {/* Add badges for some tabs */}
                {tab.key === 'workflows' && workflows?.workflows && workflows.workflows.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {workflows.workflows.length}
                  </span>
                )}
                {tab.key === 'messages' && messageHistory?.messages && messageHistory.messages.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {messageHistory.messages.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Agent Status Cards */}
            {systemStatus && Object.keys(systemStatus.agents).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(systemStatus.agents).map(([agentId, agent]) => (
                  <AgentStatusCard
                    key={agentId}
                    agentId={agentId}
                    agent={agent}
                    onRestart={() => restartAgent.mutate(agentId)}
                    isRestarting={restartAgent.isLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center py-8">
                <CpuChipIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agents detected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The agent system may not be running or accessible.
                </p>
                <button
                  onClick={refreshData}
                  className="mt-4 btn-primary"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading message history...</span>
              </div>
            ) : (
              <MessageHistory messages={messageHistory?.messages || []} />
            )}
          </div>
        )}

        {activeTab === 'workflows' && (
          <div>
            {workflowsLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading workflows...</span>
              </div>
            ) : (
              <WorkflowMonitor workflows={workflows?.workflows || []} />
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            {metricsLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading metrics...</span>
              </div>
            ) : (
              <MetricsDashboard metrics={metrics} />
            )}
          </div>
        )}
      </div>

      {/* System Actions */}
      {systemStatus && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshData}
              className="btn-secondary"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh All Data
            </button>
            
            {Object.values(systemStatus.agents).some(agent => agent.status === 'error') && (
              <button
                onClick={() => {
                  // Restart all error agents
                  Object.entries(systemStatus.agents).forEach(([agentId, agent]) => {
                    if (agent.status === 'error') {
                      restartAgent.mutate(agentId)
                    }
                  })
                }}
                disabled={restartAgent.isLoading}
                className="btn-warning"
              >
                {restartAgent.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Restarting Agents...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Restart Error Agents
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}