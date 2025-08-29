import { SystemStatus } from '@/types'
import { classNames } from '@/utils/classNames'
import {
    CheckCircleIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import React from 'react'

interface SystemHealthProps {
  systemStatus?: SystemStatus
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ systemStatus }) => {
  if (!systemStatus) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="text-center py-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const agents = Object.entries(systemStatus.agents)
  const healthyAgents = agents.filter(([_, agent]) => agent.status === 'idle' || agent.status === 'busy')
  const errorAgents = agents.filter(([_, agent]) => agent.status === 'error')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
      case 'busy':
        return CheckCircleIcon
      case 'error':
        return XCircleIcon
      default:
        return ExclamationTriangleIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'text-green-500'
      case 'busy':
        return 'text-blue-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
      
      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Overall Status</span>
          <div className="flex items-center">
            {systemStatus.system_status === 'operational' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            )}
            <span className={classNames(
              'text-sm font-medium',
              systemStatus.system_status === 'operational' ? 'text-green-700' : 'text-yellow-700'
            )}>
              {systemStatus.system_status}
            </span>
          </div>
        </div>

        {/* Agent Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Agents</h4>
          <div className="space-y-2">
            {agents.map(([agentId, agent]) => {
              const StatusIcon = getStatusIcon(agent.status)
              return (
                <div key={agentId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CpuChipIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 capitalize">{agentId}</span>
                  </div>
                  <div className="flex items-center">
                    <StatusIcon className={classNames('h-4 w-4 mr-1', getStatusColor(agent.status))} />
                    <span className={classNames('text-xs font-medium', getStatusColor(agent.status))}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">{healthyAgents.length}</p>
            <p className="text-xs text-gray-500">Healthy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600">{errorAgents.length}</p>
            <p className="text-xs text-gray-500">Errors</p>
          </div>
        </div>
      </div>
    </div>
  )
}