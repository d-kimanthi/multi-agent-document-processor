import { classNames } from '@/utils/classNames'
import React from 'react'

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

const changeClasses = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600',
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeType = 'neutral',
}) => {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={classNames('p-3 rounded-lg', colorClasses[color])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={classNames('text-sm', changeClasses[changeType])}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}