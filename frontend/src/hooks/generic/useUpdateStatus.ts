/**
 * Generic useUpdateStatus Hook
 *
 * Handles terminal status changes for all entities.
 * - Lead: 'dropped'
 * - Client: 'not_eligible', 'not_proceeding'
 * - Case: 'declined', 'withdrawn', 'disbursed'
 *
 * Note: For case stage forward progression (non-terminal), use useMoveStage instead.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entityApi } from '@/api/entity'
import type { EntityType, UpdateStatusInput } from './types'
import { ENTITY_QUERY_KEYS } from './types'

// Terminal statuses per entity type (status change, not stage progression)
// Note: 'disbursed' for cases is reached via useMoveStage, not useUpdateStatus
const TERMINAL_STATUSES: Record<EntityType, string[]> = {
  lead: ['dropped'],
  client: ['notEligible', 'notProceeding'],
  case: ['declined', 'withdrawn'],
}

// Status field name per entity (lead/client use 'status', case uses 'stage')
const STATUS_FIELD: Record<EntityType, string> = {
  lead: 'status',
  client: 'status',
  case: 'stage',
}

export function useUpdateStatus(entityType: EntityType) {
  const queryClient = useQueryClient()
  const baseKey = ENTITY_QUERY_KEYS[entityType]
  const statusField = STATUS_FIELD[entityType]

  // Build the detail query key based on entity type
  const getDetailKey = (id: number) =>
    entityType === 'lead' ? [...baseKey, id] : [...baseKey, 'detail', id]

  return useMutation({
    mutationFn: async ({ entityId, status, reason, notes }: UpdateStatusInput) => {
      // Validate terminal status
      const validStatuses = TERMINAL_STATUSES[entityType]
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid terminal status '${status}' for ${entityType}. Valid: ${validStatuses.join(', ')}`
        )
      }

      if (entityType === 'case') {
        return entityApi.updateCaseStatus(
          entityId,
          status as 'declined' | 'withdrawn' | 'disbursed',
          reason,
          notes
        )
      }

      return entityApi.updateStatus(entityType as 'lead' | 'client', entityId, status, reason, notes)
    },

    onMutate: async ({ entityId, status, reason, notes }) => {
      // Cancel both detail and list queries
      await queryClient.cancelQueries({ queryKey: baseKey })

      const detailKey = getDetailKey(entityId)
      const previousDetail = queryClient.getQueryData(detailKey)

      // Create status change record for activity
      const newStatusChange = {
        id: Date.now(),
        type: status,
        ...(entityType === 'case' ? { fromStage: undefined, toStage: status } : {}),
        ...(reason ? { reason } : {}),
        notes,
        timestamp: new Date().toISOString(),
      }

      // Update detail query
      if (previousDetail) {
        const statusChangesField =
          entityType === 'case' ? 'stageChanges' : 'statusChanges'

        queryClient.setQueryData(detailKey, {
          ...previousDetail,
          [statusField]: status,
          ...(reason && entityType === 'case' ? { stageReason: reason } : {}),
          ...(reason && entityType === 'client' ? { statusReason: reason } : {}),
          [statusChangesField]: [
            newStatusChange,
            ...((previousDetail as Record<string, unknown>)[statusChangesField] as unknown[] || []),
          ],
        })
      }

      // Update all list queries optimistically
      const listKeyPattern = entityType === 'lead' ? baseKey : [...baseKey, 'list']
      queryClient.setQueriesData<unknown[]>(
        { queryKey: listKeyPattern, exact: false },
        (old) => {
          if (!old || !Array.isArray(old)) return old
          return old.map((item: Record<string, unknown>) =>
            item.id === entityId ? { ...item, [statusField]: status } : item
          )
        }
      )

      return { previousDetail, detailKey }
    },

    onError: (_, _vars, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(context.detailKey, context.previousDetail)
      }
      // Invalidate to refetch correct data
      if (entityType === 'lead') {
        queryClient.invalidateQueries({ queryKey: baseKey })
      } else {
        queryClient.invalidateQueries({ queryKey: [...baseKey, 'list'] })
      }
    },

    onSettled: (_, __, { entityId }) => {
      // Invalidate all related queries
      const detailKey = getDetailKey(entityId)
      queryClient.invalidateQueries({ queryKey: detailKey })

      if (entityType === 'lead') {
        queryClient.invalidateQueries({ queryKey: baseKey })
      } else {
        queryClient.invalidateQueries({ queryKey: [...baseKey, 'list'] })
      }
    },
  })
}
