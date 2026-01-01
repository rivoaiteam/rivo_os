/**
 * Case Hooks
 *
 * Entity-specific hooks for cases.
 * Generic operations (logCall, addNote, updateStatus) are re-exported from generic hooks.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { casesApi } from '@/api/cases'
import { useLogCall as useGenericLogCall, useAddNote as useGenericAddNote, useUpdateStatus as useGenericUpdateStatus } from '@/hooks/generic'
import type { Case, CaseFilters, BankFormType, CaseStage } from '@/types/cases'
import { ACTIVE_STAGES } from '@/types/cases'

export const CASES_QUERY_KEY = ['cases']

// ============================================================================
// Stage Helper
// ============================================================================

/**
 * Get next stage in the workflow
 */
function getNextStage(currentStage: CaseStage): CaseStage | null {
  const stageOrder: CaseStage[] = [...ACTIVE_STAGES, 'disbursed']
  const currentIndex = stageOrder.indexOf(currentStage)
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) return null
  return stageOrder[currentIndex + 1]
}

// ============================================================================
// Generic Hooks (re-exported with case entity type)
// ============================================================================

/**
 * Log a call for a case
 * Uses generic useLogCall with 'case' entity type
 */
export function useLogCaseCall() {
  return useGenericLogCall('case')
}

/**
 * Add a note to a case
 * Uses generic useAddNote with 'case' entity type
 */
export function useAddCaseNote() {
  return useGenericAddNote('case')
}

/**
 * Decline a case (terminal status)
 * Uses generic useUpdateStatus with 'case' entity type
 *
 * Usage: declineCase.mutate({ entityId: caseId, status: 'declined', reason: '...' })
 */
export function useDeclineCase() {
  return useGenericUpdateStatus('case')
}

/**
 * Withdraw a case (terminal status)
 * Uses generic useUpdateStatus with 'case' entity type
 *
 * Usage: withdrawCase.mutate({ entityId: caseId, status: 'withdrawn', reason: '...' })
 */
export function useWithdrawCase() {
  return useGenericUpdateStatus('case')
}

// ============================================================================
// Helper Functions
// ============================================================================

function useInvalidateCases() {
  const queryClient = useQueryClient()
  return (id?: number, listOnly = false) => {
    if (id && !listOnly) queryClient.invalidateQueries({ queryKey: [...CASES_QUERY_KEY, 'detail', id] })
    queryClient.invalidateQueries({ queryKey: [...CASES_QUERY_KEY, 'list'] })
  }
}

function useInvalidateCaseDetail() {
  const queryClient = useQueryClient()
  return (id: number) => {
    queryClient.invalidateQueries({ queryKey: [...CASES_QUERY_KEY, 'detail', id] })
  }
}

// ============================================================================
// List Hook
// ============================================================================

/**
 * Get cases with filters (for Kanban)
 */
export function useCases(filters?: CaseFilters) {
  return useQuery({
    queryKey: [...CASES_QUERY_KEY, 'list', filters],
    queryFn: () => casesApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// Detail Hook
// ============================================================================

/**
 * Get single case with stage info
 */
export function useCase(id: number | null) {
  return useQuery({
    queryKey: [...CASES_QUERY_KEY, 'detail', id],
    queryFn: () => casesApi.get(id!),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

// ============================================================================
// CRUD Hooks
// ============================================================================

/**
 * Create a new case
 */
export function useCreateCase() {
  const invalidate = useInvalidateCases()
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => invalidate(),
  })
}

/**
 * Update a case with optimistic update
 */
export function useUpdateCase() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCases()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof casesApi.update>[1] }) =>
      casesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [...CASES_QUERY_KEY, 'detail', id] })
      const previous = queryClient.getQueryData<Case>([...CASES_QUERY_KEY, 'detail', id])
      if (previous) {
        queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', id], { ...previous, ...data })
      }
      return { previous }
    },
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', id], context.previous)
      }
    },
    onSettled: (_, __, { id }) => invalidate(id),
  })
}

// ============================================================================
// Bank Form Hooks
// ============================================================================

/**
 * Upload a bank form for a case
 */
export function useUploadBankForm() {
  const invalidate = useInvalidateCaseDetail()
  return useMutation({
    mutationFn: ({ id, type, file }: { id: number; type: BankFormType; file: File }) =>
      casesApi.uploadBankForm(id, type, file),
    onSuccess: (_, { id }) => invalidate(id),
  })
}

/**
 * Delete a bank form from a case
 */
export function useDeleteBankForm() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCaseDetail()
  return useMutation({
    mutationFn: ({ caseId, formId }: { caseId: number; formId: number }) =>
      casesApi.deleteBankForm(caseId, formId),
    onMutate: async ({ caseId, formId }) => {
      await queryClient.cancelQueries({ queryKey: [...CASES_QUERY_KEY, 'detail', caseId] })
      const previous = queryClient.getQueryData<Case>([...CASES_QUERY_KEY, 'detail', caseId])
      if (previous) {
        queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', caseId], {
          ...previous,
          bankForms: previous.bankForms.filter(f => f.id !== formId),
        })
      }
      return { previous }
    },
    onError: (_, { caseId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', caseId], context.previous)
      }
    },
    onSettled: (_, __, { caseId }) => invalidate(caseId),
  })
}

// ============================================================================
// Progress Hook (Stage Movement)
// ============================================================================

/**
 * Move case to next stage (forward progression)
 * This is for non-terminal stage movement only.
 * For terminal states (declined, withdrawn), use useDeclineCase or useWithdrawCase.
 */
export function useMoveStage() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCases()
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      casesApi.advanceStage(id, notes),
    onMutate: async ({ id, notes }) => {
      await queryClient.cancelQueries({ queryKey: [...CASES_QUERY_KEY, 'detail', id] })
      const previous = queryClient.getQueryData<Case>([...CASES_QUERY_KEY, 'detail', id])
      if (previous) {
        const nextStage = getNextStage(previous.stage)
        if (nextStage) {
          const newStageChange = {
            id: Date.now(),
            fromStage: previous.stage,
            toStage: nextStage,
            notes: notes || '',
            timestamp: new Date().toISOString(),
          }
          queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', id], {
            ...previous,
            stage: nextStage,
            stageChanges: [newStageChange, ...previous.stageChanges],
          })
        }
      }
      return { previous }
    },
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CASES_QUERY_KEY, 'detail', id], context.previous)
      }
    },
    onSettled: (_, __, { id }) => invalidate(id),
  })
}

// Alias for backward compatibility
export const useAdvanceStage = useMoveStage

/**
 * Set stage directly (for Kanban drag and drop)
 */
export function useSetStage() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateCases()
  return useMutation({
    mutationFn: ({ id, stage, notes }: { id: number; stage: CaseStage; notes?: string }) =>
      casesApi.setStage(id, stage, notes),
    onMutate: async ({ id, stage }) => {
      // Optimistically update list caches
      await queryClient.cancelQueries({ queryKey: [...CASES_QUERY_KEY, 'list'] })

      const listQueries = queryClient.getQueriesData({ queryKey: [...CASES_QUERY_KEY, 'list'] })
      const previousList: Array<[unknown, unknown]> = []
      listQueries.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          previousList.push([key, data])
          const updated = data.map((c: { id: number; stage: string }) => c.id === id ? { ...c, stage } : c)
          queryClient.setQueryData(key as string[], updated)
        }
      })

      return { previousList }
    },
    onError: (_, __, context) => {
      context?.previousList?.forEach(([key, data]) => {
        queryClient.setQueryData(key as string[], data)
      })
    },
    onSettled: () => invalidate(),
  })
}
