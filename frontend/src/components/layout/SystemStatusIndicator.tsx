import { agentApi } from '@/services/api'
import { classNames } from '@/utils/classNames'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import React from 'react'
import { useQuery } from 'react-query'

export const SystemStatusIndicator: React.FC = () => {
  const { data: systemStatus, isError } = useQuery(
    'systemStatus',
    agentApi.getSystemStatus,
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      retry: 2,
    }
  )

  const getStatusInfo = () => {
    if (isError) {
      return {
        status: 'error',
        icon: XCircleIcon,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        message: 'System Error',
      }
    }

    if (!systemStatus) {
      return {
        status: 'loading',
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        message: 'Connecting...',
      }
    }

    const activeAgents = Object.values(systemStatus.agents).filter(
      (agent) => agent.status !== 'stopped'
    ).length
    const totalAgents = Object.keys(systemStatus.agents).length

    if (activeAgents === totalAgents && systemStatus.system_status === 'operational') {
      return {
        status: 'operational',
        icon: CheckCircleIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        message: 'All Systems Operational',
      }
    }

    return {
      status: 'warning',
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      message: `${activeAgents}/${totalAgents} Agents Active`,
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div
        className={classNames(
          'flex items-center space-x-2 px-3 py-2 rounded-lg border shadow-sm',
          statusInfo.bgColor,
          statusInfo.borderColor
        )}
      >
        <StatusIcon className={classNames('h-5 w-5', statusInfo.color)} />
        <span className={classNames('text-sm font-medium', statusInfo.color)}>
          {statusInfo.message}
        </span>
        {systemStatus && (
          <div className="text-xs text-gray-500">
            {systemStatus.active_workflows} workflows
          </div>
        )}
      </div>
    </div>
  )
}