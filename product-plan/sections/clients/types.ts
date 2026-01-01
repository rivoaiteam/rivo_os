// =============================================================================
// Data Types
// =============================================================================

export type ResidencyStatus = 'citizen' | 'resident'

export type EmploymentStatus = 'employed' | 'selfEmployed'

export type EligibilityStatus = 'pending' | 'eligible' | 'notEligible'

export type ClientStatus = 'active' | 'converted' | 'notProceeding' | 'notEligible'

export type DocumentType =
  | 'passport'
  | 'emiratesId'
  | 'visa'
  | 'salaryCertificate'
  | 'payslips'
  | 'bankStatements'
  | 'creditCardStatement'
  | 'loanStatements'

export type DocumentStatus = 'missing' | 'uploaded' | 'verified' | 'notApplicable'

export type CallOutcome = 'connected' | 'noAnswer' | 'busy' | 'wrongNumber' | 'switchedOff'

export type MessageDirection = 'inbound' | 'outbound'

export type Channel = 'Meta' | 'Google' | 'WhatsApp' | 'Email' | 'AskRivo' | 'PartnerDSA' | 'RMA'

export interface Document {
  id: string
  type: DocumentType
  status: DocumentStatus
  uploadedAt?: string
}

export interface CallLog {
  id: string
  outcome: CallOutcome
  timestamp: string
  notes?: string
}

export interface Note {
  id: string
  content: string
  timestamp: string
}

export type StatusChangeType = 'converted_to_case' | 'not_eligible' | 'not_proceeding'

export interface StatusChange {
  id: string
  type: StatusChangeType
  timestamp: string
  notes?: string
}

export interface Message {
  id: string
  direction: MessageDirection
  content: string
  timestamp: string
}

export interface ClientSource {
  channel: Channel
  campaign?: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  residencyStatus: ResidencyStatus
  dateOfBirth: string
  nationality: string
  employmentStatus: EmploymentStatus
  monthlySalary: number
  /** Self-declared monthly liabilities (loans, credit cards, etc.) */
  monthlyLiabilities: number | null
  /** How much the client wants to borrow */
  loanAmount: number | null
  /** Estimated value of the property */
  estimatedPropertyValue: number | null
  /** Calculated eligibility status based on DBR/LTV */
  eligibilityStatus: EligibilityStatus
  /** Estimated Debt Burden Ratio (percentage) */
  estimatedDBR: number | null
  /** Estimated Loan to Value ratio (percentage) */
  estimatedLTV: number | null
  /** Maximum loan amount the client qualifies for */
  maxLoanAmount: number | null
  /** Banks where the client is eligible to apply */
  eligibleBanks: string[] | null
  /** When the client record was created */
  createdAt: string
  /** When the client was last updated (last activity: call, note, or status change) */
  updatedAt?: string
  /** Current status if not active */
  status?: ClientStatus
  /** Reason for not proceeding or not eligible */
  statusReason?: string
  /** Where the client came from */
  source: ClientSource
  /** Documents collected for the client */
  documents: Document[]
  /** Phone call history */
  callLogs: CallLog[]
  /** WhatsApp message history */
  messages: Message[]
  /** Notes added by agent */
  notes?: Note[]
  /** Status change activity log */
  statusChanges?: StatusChange[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface ClientsListProps {
  /** The list of clients to display */
  clients: Client[]
  /** The currently selected client (for side panel) */
  selectedClientId?: string
  /** Called when user clicks on a client row */
  onSelectClient?: (id: string) => void
  /** Called when user closes the side panel */
  onCloseSidePanel?: () => void
  /** Called when user updates client identity or financials */
  onUpdateClient?: (id: string, updates: Partial<Client>) => void
  /** Called when user uploads a document */
  onUploadDocument?: (clientId: string, documentType: DocumentType, file: File) => void
  /** Called when user requests documents via WhatsApp */
  onRequestDocuments?: (clientId: string, documentTypes: DocumentType[]) => void
  /** Called when user logs a call */
  onLogCall?: (clientId: string, outcome: CallOutcome, notes?: string) => void
  /** Called when user adds a note */
  onAddNote?: (clientId: string, content: string) => void
  /** Called when user sends a WhatsApp message */
  onSendMessage?: (clientId: string, content: string) => void
  /** Called when user creates a case from client */
  onCreateCase?: (clientId: string, notes?: string) => void
  /** Called when user marks client as not proceeding */
  onMarkNotProceeding?: (clientId: string, notes?: string) => void
  /** Called when user marks client as not eligible */
  onMarkNotEligible?: (clientId: string, notes?: string) => void
}

export interface ClientFilters {
  eligibilityStatus?: EligibilityStatus
  channel?: Channel
  search?: string
}

export interface ClientsPageProps extends ClientsListProps {
  /** Current filter values */
  filters?: ClientFilters
  /** Called when filters change */
  onFilterChange?: (filters: ClientFilters) => void
  /** Called when user creates a new client */
  onCreateClient?: (client: Omit<Client, 'id' | 'createdAt' | 'documents' | 'callLogs' | 'messages' | 'eligibilityStatus' | 'estimatedDBR' | 'estimatedLTV' | 'maxLoanAmount' | 'eligibleBanks'>) => void
  /** Whether to show create mode */
  isCreateMode?: boolean
  /** Called to toggle create mode */
  onToggleCreateMode?: () => void
}