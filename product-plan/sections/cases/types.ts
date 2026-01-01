// =============================================================================
// Data Types
// =============================================================================

export type CaseType = 'residential' | 'commercial'

export type ServiceType = 'assisted' | 'fullyPackaged'

export type ApplicationType = 'individual' | 'joint'

export type MortgageType = 'islamic' | 'conventional'

export type Emirate = 'abuDhabi' | 'ajman' | 'dubai' | 'fujairah' | 'rak' | 'sharjah' | 'uaq'

export type TransactionType = 'primaryPurchase' | 'resale' | 'buyoutEquity' | 'buyout' | 'equity'

export type PropertyStatus = 'ready' | 'underConstruction'

export type CaseStage =
  | 'processing'
  | 'submitted'
  | 'underReview'
  | 'preApproved'
  | 'valuation'
  | 'folProcessing'
  | 'folReceived'
  | 'folSigned'
  | 'disbursed'
  | 'declined'
  | 'withdrawn'

export type BankFormType =
  | 'accountOpeningForm'
  | 'fts'
  | 'kfs'
  | 'undertakings'
  | 'bankChecklist'

export type BankFormStatus = 'missing' | 'uploaded' | 'verified'

export type CallOutcome = 'connected' | 'noAnswer'

// =============================================================================
// Interfaces
// =============================================================================

export interface BankForm {
  id: string
  type: BankFormType
  status: BankFormStatus
  uploadedAt?: string
}

export interface MortgageTerm {
  years: number
  months: number
}

export interface Note {
  id: string
  content: string
  timestamp: string
}

export interface CallLog {
  id: string
  outcome: CallOutcome
  timestamp: string
  notes?: string
}

export interface StageChange {
  id: string
  fromStage: CaseStage | null
  toStage: CaseStage
  timestamp: string
  notes?: string
}

export interface Case {
  id: string
  /** Display ID in format RV-XXXXX */
  caseId: string
  /** Reference to the linked client */
  clientId: string

  // Deal fields (11 mandatory)
  caseType: CaseType
  serviceType: ServiceType
  applicationType: ApplicationType
  /** Bank IDs, max 3 */
  bankSelection: string[]
  mortgageType: MortgageType
  emirate: Emirate
  /** Loan amount in AED */
  loanAmount: number
  transactionType: TransactionType
  mortgageTerm: MortgageTerm
  /** Estimated property value in AED */
  estimatedPropertyValue: number
  propertyStatus: PropertyStatus

  // Status
  stage: CaseStage
  /** Reason for declined/withdrawn */
  stageReason?: string

  // Timestamps
  createdAt: string
  updatedAt?: string

  // Case-specific documents (bank forms)
  bankForms: BankForm[]

  // Activity
  callLogs: CallLog[]
  notes?: Note[]
  stageChanges?: StageChange[]
}

// =============================================================================
// Display Labels
// =============================================================================

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  assisted: 'Assisted',
  fullyPackaged: 'Fully Packaged',
}

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  individual: 'Individual',
  joint: 'Joint',
}

export const MORTGAGE_TYPE_LABELS: Record<MortgageType, string> = {
  islamic: 'Islamic',
  conventional: 'Conventional',
}

export const EMIRATE_LABELS: Record<Emirate, string> = {
  abuDhabi: 'Abu Dhabi',
  ajman: 'Ajman',
  dubai: 'Dubai',
  fujairah: 'Fujairah',
  rak: 'Ras Al Khaimah',
  sharjah: 'Sharjah',
  uaq: 'Umm Al Quwain',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  primaryPurchase: 'Primary Purchase',
  resale: 'Resale',
  buyoutEquity: 'Buyout + Equity',
  buyout: 'Buyout',
  equity: 'Equity',
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  ready: 'Ready',
  underConstruction: 'Under Construction',
}

export const CASE_STAGE_LABELS: Record<CaseStage, string> = {
  processing: 'Processing',
  submitted: 'Submitted',
  underReview: 'Under Review',
  preApproved: 'Pre-Approved',
  valuation: 'Valuation',
  folProcessing: 'FOL Processing',
  folReceived: 'FOL Received',
  folSigned: 'FOL Signed',
  disbursed: 'Disbursed',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export const BANK_FORM_TYPE_LABELS: Record<BankFormType, string> = {
  accountOpeningForm: 'Account Opening Form',
  fts: 'FTS',
  kfs: 'KFS',
  undertakings: 'Undertakings',
  bankChecklist: 'Bank Checklist',
}

// =============================================================================
// Stage Pipeline Helpers
// =============================================================================

/** Ordered list of active stages (before terminal states) */
export const ACTIVE_STAGES: CaseStage[] = [
  'processing',
  'submitted',
  'underReview',
  'preApproved',
  'valuation',
  'folProcessing',
  'folReceived',
  'folSigned',
]

/** Terminal stages (case is complete) */
export const TERMINAL_STAGES: CaseStage[] = ['disbursed', 'declined', 'withdrawn']

/** Get the next stage in the pipeline */
export function getNextStage(currentStage: CaseStage): CaseStage | null {
  const currentIndex = ACTIVE_STAGES.indexOf(currentStage)
  if (currentIndex === -1) return null // Already terminal
  if (currentIndex === ACTIVE_STAGES.length - 1) return 'disbursed' // Last active -> disbursed
  return ACTIVE_STAGES[currentIndex + 1]
}

/** Check if a stage is terminal */
export function isTerminalStage(stage: CaseStage): boolean {
  return TERMINAL_STAGES.includes(stage)
}

/** Check if a stage is active (not terminal) */
export function isActiveStage(stage: CaseStage): boolean {
  return ACTIVE_STAGES.includes(stage)
}

// =============================================================================
// Component Props
// =============================================================================

export interface Bank {
  id: string
  name: string
}

export interface ClientSummary {
  id: string
  firstName: string
  lastName: string
  phone: string
  estimatedDBR: number | null
  estimatedLTV: number | null
}

export interface CasesListProps {
  /** The list of cases to display */
  cases: Case[]
  /** The list of clients (for display names) */
  clients: ClientSummary[]
  /** The list of banks (for display names) */
  banks: Bank[]
  /** The currently selected case (for side panel) */
  selectedCaseId?: string
  /** Called when user clicks on a case row */
  onSelectCase?: (id: string) => void
  /** Called when user closes the side panel */
  onCloseSidePanel?: () => void
  /** Called when user updates case deal fields */
  onUpdateCase?: (id: string, updates: Partial<Case>) => void
  /** Called when user uploads a bank form */
  onUploadBankForm?: (caseId: string, formType: BankFormType, file: File) => void
  /** Called when user logs a call */
  onLogCall?: (caseId: string, outcome: CallOutcome, notes?: string) => void
  /** Called when user adds a note */
  onAddNote?: (caseId: string, content: string) => void
  /** Called when user advances to next stage */
  onAdvanceStage?: (caseId: string, notes?: string) => void
  /** Called when user declines the case */
  onDecline?: (caseId: string, reason: string) => void
  /** Called when user withdraws the case */
  onWithdraw?: (caseId: string, reason: string) => void
}

export interface CaseFilters {
  stage?: CaseStage
  bank?: string
  search?: string
}

export interface CasesPageProps extends CasesListProps {
  /** Current filter values */
  filters?: CaseFilters
  /** Called when filters change */
  onFilterChange?: (filters: CaseFilters) => void
  /** Called when user creates a new case */
  onCreateCase?: (
    caseData: Omit<
      Case,
      'id' | 'caseId' | 'createdAt' | 'bankForms' | 'callLogs' | 'notes' | 'stageChanges'
    >
  ) => void
  /** Whether to show create mode */
  isCreateMode?: boolean
  /** Called to toggle create mode */
  onToggleCreateMode?: () => void
}