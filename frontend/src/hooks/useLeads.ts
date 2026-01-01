/**
 * React Query hooks for Leads
 *
 * Re-exports from the new modular structure for backward compatibility.
 * New code should import from '@/hooks/leads' directly.
 */

export {
  LEADS_QUERY_KEY,
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLead,
  useLogCall,
  useAddNote,
  useDropLead,
  useConvertLead,
} from './leads'
