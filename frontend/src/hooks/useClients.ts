/**
 * React Query hooks for Clients
 *
 * Re-exports from the new modular structure for backward compatibility.
 * New code should import from '@/hooks/clients' directly.
 */

export {
  CLIENTS_QUERY_KEY,
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useLogClientCall,
  useAddClientNote,
  useUploadDocument,
  useDeleteDocument,
  useMarkNotProceeding,
  useMarkNotEligible,
  useCreateCase,
  useConvertClient,
} from './clients'
