/**
 * React Query hooks for Cases
 *
 * Re-exports from the new modular structure for backward compatibility.
 * New code should import from '@/hooks/cases' directly.
 */

export {
  CASES_QUERY_KEY,
  useCases,
  useCase,
  useCreateCase,
  useUpdateCase,
  useLogCaseCall,
  useAddCaseNote,
  useUploadBankForm,
  useDeleteBankForm,
  useAdvanceStage,
  useMoveStage,
  useDeclineCase,
  useWithdrawCase,
  useSetStage,
} from './cases'
