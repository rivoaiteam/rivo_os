/**
 * Lead Hooks
 *
 * Entity-specific hooks for leads.
 * Generic operations (logCall, addNote) are re-exported from generic hooks.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { leadsApi } from '@/api/leads'
import { useLogCall as useGenericLogCall, useAddNote as useGenericAddNote, useUpdateStatus as useGenericUpdateStatus } from '@/hooks/generic'
import type { Lead, LeadFilters } from '@/types/leads'

export const LEADS_QUERY_KEY = ['leads']

// ============================================================================
// Generic Hooks (re-exported with lead entity type)
// ============================================================================

/**
 * Log a call for a lead
 * Uses generic useLogCall with 'lead' entity type
 */
export function useLogCall() {
  return useGenericLogCall('lead')
}

/**
 * Add a note to a lead
 * Uses generic useAddNote with 'lead' entity type
 */
export function useAddNote() {
  return useGenericAddNote('lead')
}

/**
 * Drop a lead (terminal status change)
 * Uses generic useUpdateStatus with 'lead' entity type
 *
 * Usage: dropLead.mutate({ entityId: leadId, status: 'dropped', notes: '...' })
 */
export function useDropLead() {
  return useGenericUpdateStatus('lead')
}

// ============================================================================
// List Hook
// ============================================================================

/**
 * Get paginated leads with filters
 */
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, filters],
    queryFn: () => leadsApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Get single lead with computed SLA
 */
export function useLead(id: number) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, id],
    queryFn: () => leadsApi.get(id),
    enabled: !!id,
  })
}

// ============================================================================
// CRUD Hooks
// ============================================================================

/**
 * Create a new lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY })
    },
  })
}

/**
 * Update a lead with optimistic update
 */
export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof leadsApi.update>[1] }) =>
      leadsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [...LEADS_QUERY_KEY, id] })
      const previous = queryClient.getQueryData<Lead>([...LEADS_QUERY_KEY, id])
      if (previous) {
        queryClient.setQueryData([...LEADS_QUERY_KEY, id], { ...previous, ...data })
      }
      return { previous }
    },
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...LEADS_QUERY_KEY, id], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY })
    },
  })
}

// ============================================================================
// Progress Hook (Conversion)
// ============================================================================

/**
 * Convert lead to client
 * Creates a new client from the lead data
 */
export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      leadsApi.convert(id, notes),
    onMutate: async ({ id, notes }) => {
      // Cancel both detail and list queries
      await queryClient.cancelQueries({ queryKey: LEADS_QUERY_KEY })

      const previousDetail = queryClient.getQueryData<Lead>([...LEADS_QUERY_KEY, id])

      const newStatusChange = {
        id: Date.now(),
        type: 'converted_to_client' as const,
        notes,
        timestamp: new Date().toISOString(),
      }

      // Update detail query
      if (previousDetail) {
        queryClient.setQueryData([...LEADS_QUERY_KEY, id], {
          ...previousDetail,
          status: 'converted',
          statusChanges: [newStatusChange, ...(previousDetail.statusChanges || [])],
        })
      }

      // Update all list queries optimistically
      queryClient.setQueriesData<Lead[]>(
        { queryKey: LEADS_QUERY_KEY, exact: false },
        (old) => {
          if (!old || !Array.isArray(old)) return old
          return old.map(lead =>
            lead.id === id
              ? { ...lead, status: 'converted' as const, statusChanges: [newStatusChange, ...(lead.statusChanges || [])] }
              : lead
          )
        }
      )

      return { previousDetail }
    },
    onError: (_, { id }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData([...LEADS_QUERY_KEY, id], context.previousDetail)
      }
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY })
      // Also invalidate clients since a new client was created
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
