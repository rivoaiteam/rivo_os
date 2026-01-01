// =============================================================================
// Data Types
// =============================================================================

export type LeadStatus = 'new' | 'dropped' | 'converted'

export type CallOutcome = 'connected' | 'noAnswer'


export interface DropReason {
  notes?: string
}

export interface CallLog {
  id: string
  outcome: CallOutcome
  timestamp: string
  /** Optional note added with the call */
  notes?: string
}

export interface Note {
  id: string
  content: string
  timestamp: string
}

export type StatusChangeType = 'converted_to_client' | 'dropped'

export interface StatusChange {
  id: string
  type: StatusChangeType
  timestamp: string
  /** Optional note added with the status change */
  notes?: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  /** Campaign name (not applicable for AskRivo channel) */
  campaign?: string
  intent: string
  /** When the lead was created */
  createdAt: string
  /** When the lead was last updated (last activity: call, note, or status change) */
  updatedAt?: string
  status: LeadStatus
  callLogs: CallLog[]
  /** Notes added by agent */
  notes?: Note[]
  /** AskRivo chatbot conversation transcript (only for AskRivo channel) */
  transcript?: string
  /** Reason for dropping the lead (only when status is 'dropped') */
  dropReason?: DropReason
  /** Status change activity log */
  statusChanges?: StatusChange[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface LeadsListProps {
  /** The list of leads to display */
  leads: Lead[]
  /** The currently selected lead (for side panel) */
  selectedLeadId?: string
  /** Called when user clicks on a lead row */
  onSelectLead?: (id: string) => void
  /** Called when user closes the side panel */
  onCloseSidePanel?: () => void
  /** Called when user logs a call (with optional notes) */
  onLogCall?: (leadId: string, outcome: CallOutcome, notes?: string) => void
  /** Called when user adds a standalone note */
  onAddNote?: (leadId: string, content: string) => void
  /** Called when user drops a lead (with optional notes) */
  onDropLead?: (leadId: string, notes?: string) => void
  /** Called when user proceeds to create a client (with optional notes) */
  onProceedToClient?: (leadId: string, notes?: string) => void
  /** Called when user updates lead */
  onUpdateLead?: (leadId: string, updates: Partial<Lead>) => void
}

export interface LeadFilters {
  campaign?: string
  status?: LeadStatus
}

export interface LeadsPageProps extends LeadsListProps {
  /** Current filter values */
  filters?: LeadFilters
  /** Called when filters change */
  onFilterChange?: (filters: LeadFilters) => void
  /** List of available campaigns for filter dropdown */
  availableCampaigns?: string[]
}