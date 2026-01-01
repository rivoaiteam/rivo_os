/**
 * Case Types
 */

import type { Note, CallOutcome, CallLog } from './common'

export type { CallOutcome, CallLog }

export type CaseType = 'residential' | 'commercial'
export type ServiceType = 'assisted' | 'fullyPackaged'
export type ApplicationType = 'individual' | 'joint'
export type MortgageType = 'islamic' | 'conventional'
export type PropertyStatus = 'ready' | 'underConstruction'
export type TransactionType = 'primaryPurchase' | 'resale' | 'buyoutEquity' | 'buyout' | 'equity'

export type Emirate = 'abuDhabi' | 'ajman' | 'dubai' | 'fujairah' | 'rak' | 'sharjah' | 'uaq'

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

export const ACTIVE_STAGES: CaseStage[] = [
  'processing', 'submitted', 'underReview', 'preApproved',
  'valuation', 'folProcessing', 'folReceived', 'folSigned'
]

export const TERMINAL_STAGES: CaseStage[] = ['disbursed', 'declined', 'withdrawn']

export type BankFormType = 'accountOpeningForm' | 'fts' | 'kfs' | 'undertakings' | 'bankChecklist' | 'other'
export type BankFormStatus = 'missing' | 'uploaded' | 'verified'

export type RateType = 'fixed' | 'variable'
export type RateTerm = 1 | 2 | 3 | 4 | 5  // Years

export interface BankProduct {
  id: number
  bankName: string
  productName: string
  rate?: number
  maxLtv?: number
  maxDbr?: number
  isActive: boolean
}

// Selected bank product with rate details for a case
export interface SelectedBankProduct {
  bankName: string
  rateType: RateType
  ratePercent: number
  termYears: RateTerm
}

export interface BankForm {
  id: number
  type: BankFormType
  status: BankFormStatus
  fileUrl?: string
  uploadedAt?: string
}

export interface ClientSummary {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  sourceDisplay?: string
}

export interface CallLog {
  id: number
  outcome: CallOutcome
  notes?: string
  timestamp: string
}

export type { Note }

export interface CaseStageChange {
  id: number
  fromStage?: string
  toStage: string
  notes?: string
  timestamp: string
}

// List view - minimal data for fast table loading
export interface CaseListItem {
  id: number
  caseId: string
  client: ClientSummary
  caseType: CaseType
  emirate: Emirate
  loanAmount: number
  stage: CaseStage
  createdAt: string
  updatedAt?: string
  bankFormsCount: string
  bankName?: string
  bankIcon?: string
}

// Detail view - full data with activity
export interface Case {
  id: number
  caseId: string
  client: ClientSummary
  // Deal Info
  caseType: CaseType
  serviceType: ServiceType
  applicationType: ApplicationType
  mortgageType: MortgageType
  // Property
  emirate: Emirate
  transactionType: TransactionType
  propertyStatus: PropertyStatus
  estimatedPropertyValue: number
  // Loan
  loanAmount: number
  mortgageTermYears: number
  mortgageTermMonths: number
  // Bank Product (flattened for DB storage)
  bankName?: string
  rateType?: RateType
  ratePercent?: number
  fixedPeriodYears?: RateTerm
  // Stage & Status
  stage: CaseStage
  stageReason?: string
  // Related data
  bankForms: BankForm[]
  bankProducts?: BankProduct[]
  callLogs: CallLog[]
  notes: Note[]
  stageChanges: CaseStageChange[]
  createdAt: string
  updatedAt?: string
}

export interface CaseFilters {
  stage?: CaseStage
  status?: 'active' | 'terminal'
  client?: number
  search?: string
}

export interface CreateCaseData {
  clientId: number
  // Deal Info
  caseType: CaseType
  serviceType: ServiceType
  applicationType: ApplicationType
  mortgageType: MortgageType
  // Property
  emirate: Emirate
  transactionType: TransactionType
  propertyStatus: PropertyStatus
  estimatedPropertyValue: number
  // Loan
  loanAmount: number
  mortgageTermYears: number
  mortgageTermMonths?: number
  // Bank Product (flattened for DB storage)
  bankName?: string
  rateType?: RateType
  ratePercent?: number
  fixedPeriodYears?: RateTerm
}

// Available banks for selection
export const BANKS = [
  'ADCB',
  'ADIB',
  'CBD',
  'DIB',
  'Emirates NBD',
  'FAB',
  'Mashreq',
  'RAKBANK',
  'Standard Chartered',
] as const

export type BankName = typeof BANKS[number]

export const STAGE_LABELS: Record<CaseStage, string> = {
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

export const EMIRATE_LABELS: Record<Emirate, string> = {
  abuDhabi: 'Abu Dhabi',
  ajman: 'Ajman',
  dubai: 'Dubai',
  fujairah: 'Fujairah',
  rak: 'Ras Al Khaimah',
  sharjah: 'Sharjah',
  uaq: 'Umm Al Quwain',
}

export const BANK_FORM_LABELS: Record<BankFormType, string> = {
  accountOpeningForm: 'Account Opening Form',
  fts: 'FTS',
  kfs: 'KFS',
  undertakings: 'Undertakings',
  bankChecklist: 'Bank Checklist',
  other: 'Other Document',
}
