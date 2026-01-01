/**
 * Generic useAddNote Hook
 *
 * Reusable across all entities. Takes entityType as parameter.
 * Adds a note with optimistic update, rollback on error, and query invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entityApi } from '@/api/entity'
import type { EntityType, AddNoteInput, EntityWithActivity, Note } from './types'
import { ENTITY_QUERY_KEYS } from './types'

export function useAddNote(entityType: EntityType) {
  const queryClient = useQueryClient()
  const baseKey = ENTITY_QUERY_KEYS[entityType]

  // Build the detail query key based on entity type
  // Leads use [...baseKey, id], clients/cases use [...baseKey, 'detail', id]
  const getDetailKey = (id: number) =>
    entityType === 'lead' ? [...baseKey, id] : [...baseKey, 'detail', id]

  return useMutation({
    mutationFn: ({ entityId, content }: AddNoteInput) =>
      entityApi.addNote(entityType, entityId, content),

    onMutate: async ({ entityId, content }) => {
      const detailKey = getDetailKey(entityId)

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailKey })

      // Snapshot the previous value
      const previous = queryClient.getQueryData<EntityWithActivity>(detailKey)

      // Optimistically update the cache
      if (previous) {
        const newNote: Note = {
          id: Date.now(), // Temporary ID
          content,
          timestamp: new Date().toISOString(),
        }
        queryClient.setQueryData(detailKey, {
          ...previous,
          notes: [newNote, ...(previous.notes || [])],
        })
      }

      return { previous, detailKey }
    },

    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(context.detailKey, context.previous)
      }
    },

    onSettled: (_, __, { entityId }) => {
      // Invalidate queries to sync with server
      const detailKey = getDetailKey(entityId)
      queryClient.invalidateQueries({ queryKey: detailKey })

      // Also invalidate list to update 'Last Activity' column
      if (entityType === 'lead') {
        queryClient.invalidateQueries({ queryKey: baseKey })
      } else {
        queryClient.invalidateQueries({ queryKey: [...baseKey, 'list'] })
      }
    },
  })
}
