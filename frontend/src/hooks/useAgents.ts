import { agentApi } from '@/services/api'
import toast from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from 'react-query'

export const useSystemStatus = () => {
  return useQuery('systemStatus', agentApi.getSystemStatus, {
    refetchInterval: 5000, // Refresh every 5 seconds
  })
}

export const useMessageHistory = (limit: number = 100) => {
  return useQuery(['messageHistory', limit], () => agentApi.getMessageHistory(limit), {
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

export const useWorkflows = () => {
  return useQuery('workflows', agentApi.getWorkflows, {
    refetchInterval: 3000, // Refresh every 3 seconds
  })
}

export const useMetrics = () => {
  return useQuery('metrics', agentApi.getMetrics, {
    refetchInterval: 15000, // Refresh every 15 seconds
  })
}

export const useRestartAgent = () => {
  const queryClient = useQueryClient()

  return useMutation(agentApi.restartAgent, {
    onSuccess: (data, agentId) => {
      queryClient.invalidateQueries('systemStatus')
      toast.success(`Agent ${agentId} restarted successfully!`)
    },
    onError: (error: any, agentId) => {
      toast.error(`Failed to restart agent ${agentId}: ${error.response?.data?.detail || error.message}`)
    },
  })
}
