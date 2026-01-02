/**
 * Client Hooks
 *
 * Entity-specific hooks for clients.
 * Generic operations (logCall, addNote, updateStatus) are re-exported from generic hooks.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { clientsApi } from '@/api/clients'
import { useLogCall as useGenericLogCall, useAddNote as useGenericAddNote, useUpdateStatus as useGenericUpdateStatus } from '@/hooks/generic'
import type { Client, ClientFilters, DocumentType, CreateCaseData } from '@/types/clients'

export const CLIENTS_QUERY_KEY = ['clients']

// ============================================================================
// Generic Hooks (re-exported with client entity type)
// ============================================================================

/**
 * Log a call for a client
 * Uses generic useLogCall with 'client' entity type
 */
export function useLogClientCall() {
  return useGenericLogCall('client')
}

/**
 * Add a note to a client
 * Uses generic useAddNote with 'client' entity type
 */
export function useAddClientNote() {
  return useGenericAddNote('client')
}

/**
 * Mark client as withdrawn (terminal status)
 * Uses generic useUpdateStatus with 'client' entity type
 *
 * Usage: markNotProceeding.mutate({ entityId: clientId, status: 'notProceeding', notes: '...' })
 */
export function useMarkNotProceeding() {
  return useGenericUpdateStatus('client')
}

/**
 * Mark client as not eligible (terminal status)
 * Uses generic useUpdateStatus with 'client' entity type
 *
 * Usage: markNotEligible.mutate({ entityId: clientId, status: 'not_eligible', notes: '...' })
 */
export function useMarkNotEligible() {
  return useGenericUpdateStatus('client')
}

// ============================================================================
// Helper Functions
// ============================================================================

function useInvalidateClients() {
  const queryClient = useQueryClient()
  return (id?: number) => {
    if (id) queryClient.invalidateQueries({ queryKey: [...CLIENTS_QUERY_KEY, 'detail', id] })
    queryClient.invalidateQueries({ queryKey: [...CLIENTS_QUERY_KEY, 'list'] })
  }
}

// ============================================================================
// List Hook
// ============================================================================

/**
 * Get paginated clients with filters
 */
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, 'list', filters],
    queryFn: () => clientsApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Get single client with computed DBR/LTV
 */
export function useClient(id: number | null) {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, 'detail', id],
    queryFn: () => clientsApi.get(id!),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// CRUD Hooks
// ============================================================================

/**
 * Create a new client
 */
export function useCreateClient() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => invalidate(),
  })
}

/**
 * Update a client with optimistic update
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof clientsApi.update>[1] }) =>
      clientsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [...CLIENTS_QUERY_KEY, 'detail', id] })
      const previous = queryClient.getQueryData<Client>([...CLIENTS_QUERY_KEY, 'detail', id])
      if (previous) {
        queryClient.setQueryData([...CLIENTS_QUERY_KEY, 'detail', id], { ...previous, ...data })
      }
      return { previous }
    },
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CLIENTS_QUERY_KEY, 'detail', id], context.previous)
      }
    },
    onSettled: (_, __, { id }) => invalidate(id),
  })
}

// ============================================================================
// Document Hooks
// ============================================================================

/**
 * Upload a document for a client
 */
export function useUploadDocument() {
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: ({ id, type, file }: { id: number; type: DocumentType; file: File }) =>
      clientsApi.uploadDocument(id, type, file),
    onSuccess: (_, { id }) => invalidate(id),
  })
}

/**
 * Delete a document from a client
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: ({ clientId, documentId }: { clientId: number; documentId: number }) =>
      clientsApi.deleteDocument(clientId, documentId),
    onMutate: async ({ clientId, documentId }) => {
      await queryClient.cancelQueries({ queryKey: [...CLIENTS_QUERY_KEY, 'detail', clientId] })
      const previous = queryClient.getQueryData<Client>([...CLIENTS_QUERY_KEY, 'detail', clientId])
      if (previous) {
        queryClient.setQueryData([...CLIENTS_QUERY_KEY, 'detail', clientId], {
          ...previous,
          documents: previous.documents.filter(d => d.id !== documentId),
        })
      }
      return { previous }
    },
    onError: (_, { clientId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CLIENTS_QUERY_KEY, 'detail', clientId], context.previous)
      }
    },
    onSettled: (_, __, { clientId }) => invalidate(clientId),
  })
}

// ============================================================================
// Progress Hook (Conversion to Case)
// ============================================================================

/**
 * Create a case from a client (Client -> Case conversion)
 */
export function useConvertClient() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateClients()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: Partial<CreateCaseData> }) =>
      clientsApi.createCase(id, data),
    onSuccess: (_, { id }) => {
      invalidate(id)
      // Also invalidate cases since a new case was created
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

// Alias for backward compatibility
export const useCreateCase = useConvertClient
