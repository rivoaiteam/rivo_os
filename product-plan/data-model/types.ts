// =============================================================================
// Rivo OS - Core Data Model Types
// =============================================================================

// -----------------------------------------------------------------------------
// Channels & Sources
// -----------------------------------------------------------------------------

/** Sources for Leads (unverified) */
export type LeadChannel = 'Meta' | 'Google' | 'WhatsApp' | 'Email' | 'AskRivo'

/** Sources for Clients (verified + unverified) */
export type ClientChannel = 'Meta' | 'Google' | 'WhatsApp' | 'Email' | 'AskRivo' | 'PartnerDSA' | 'RMA'

/** Direct channels for new client creation (skip lead stage) */
export type DirectChannel = 'AskRivo' | 'PartnerDSA' | 'RMA'

// -----------------------------------------------------------------------------
// Lead
// -----------------------------------------------------------------------------

export type LeadStatus = 'new' | 'dropped' | 'converted'

export type CallOutcome = 'connected' | 'noAnswer' | 'busy' | 'wrongNumber' | 'switchedOff'

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

export type LeadStatusChangeType = 'converted_to_client' | 'dropped'

export interface LeadStatusChange {
  id: string
  type: LeadStatusChangeType
  timestamp: string
  notes?: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  channel: LeadChannel
  campaign?: string
  intent: string
  createdAt: string
  updatedAt?: string
  status: LeadStatus
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: LeadStatusChange[]
}

// -----------------------------------------------------------------------------
// Client
// -----------------------------------------------------------------------------

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

export interface Document {
  id: string
  type: DocumentType
  status: DocumentStatus
  uploadedAt?: string
}

export type ClientStatusChangeType = 'converted_to_case' | 'not_eligible' | 'not_proceeding'

export interface ClientStatusChange {
  id: string
  type: ClientStatusChangeType
  timestamp: string
  notes?: string
}

export interface ClientSource {
  channel: ClientChannel
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
  monthlyLiabilities: number | null
  loanAmount: number | null
  estimatedPropertyValue: number | null
  eligibilityStatus: EligibilityStatus
  estimatedDBR: number | null
  estimatedLTV: number | null
  maxLoanAmount: number | null
  eligibleBanks: string[] | null
  createdAt: string
  updatedAt?: string
  status?: ClientStatus
  statusReason?: string
  source: ClientSource
  documents: Document[]
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: ClientStatusChange[]
}

// -----------------------------------------------------------------------------
// Case
// -----------------------------------------------------------------------------

export type CaseType = 'residential' | 'commercial'
export type ServiceType = 'assisted' | 'fullyPackaged'
export type ApplicationType = 'individual' | 'joint'
export type MortgageType = 'islamic' | 'conventional'
export type PropertyStatus = 'ready' | 'underConstruction'

export type Emirate = 'abuDhabi' | 'ajman' | 'dubai' | 'fujairah' | 'rak' | 'sharjah' | 'uaq'

export type TransactionType = 'primaryPurchase' | 'resale' | 'buyoutEquity' | 'buyout' | 'equity'

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

export interface StageChange {
  id: string
  fromStage: CaseStage | null
  toStage: CaseStage
  timestamp: string
  notes?: string
}

export interface Case {
  id: string
  caseId: string  // Format: RV-XXXXX
  clientId: string
  caseType: CaseType
  serviceType: ServiceType
  applicationType: ApplicationType
  bankSelection: string[]  // Bank IDs, max 3
  mortgageType: MortgageType
  emirate: Emirate
  loanAmount: number
  transactionType: TransactionType
  mortgageTerm: MortgageTerm
  estimatedPropertyValue: number
  propertyStatus: PropertyStatus
  stage: CaseStage
  stageReason?: string
  createdAt: string
  updatedAt?: string
  bankForms: BankForm[]
  callLogs: CallLog[]
  notes?: Note[]
  stageChanges?: StageChange[]
}

// -----------------------------------------------------------------------------
// Reference Data
// -----------------------------------------------------------------------------

export interface Bank {
  id: string
  name: string
}

export interface Channel {
  id: string
  name: string
  status: 'active'
}

export type CampaignStatus = 'incubation' | 'live' | 'pause'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'agent' | 'coordinator' | 'manager'
  status: 'active' | 'inactive'
}