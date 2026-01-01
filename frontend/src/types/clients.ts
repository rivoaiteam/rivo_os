/**
 * Client Types
 */

import type { Note, CallOutcome, CallLog } from './common'

export type { CallOutcome, CallLog }

export type ResidencyStatus = 'uaeNational' | 'uaeResident' | 'nonResident'

export type EmploymentStatus = 'salaried' | 'selfEmployed'

export type EligibilityStatus = 'pending' | 'eligible' | 'notEligible'

export type ClientStatus = 'active' | 'notProceeding' | 'notEligible'

export type DocumentType =
  | 'passport'
  | 'emiratesId'
  | 'visa'
  | 'salaryCertificate'
  | 'payslips'
  | 'bankStatements'
  | 'creditCardStatement'
  | 'loanStatements'
  | 'other'

export type DocumentStatus = 'missing' | 'uploaded' | 'verified' | 'notApplicable'

export interface Document {
  id: number
  type: DocumentType
  status: DocumentStatus
  fileUrl?: string
  uploadedAt?: string
}


export type { Note }

export interface ClientStatusChange {
  id: number
  type: 'converted_from_lead' | 'converted_to_case' | 'not_eligible' | 'not_proceeding' | 'notEligible' | 'notProceeding'
  notes?: string
  timestamp: string
}

export interface ClientCase {
  id: number
  caseId: string  // Display ID like "RV-00001"
  stage: string
  bankName?: string
  bankIcon?: string
}

// List view - minimal data for fast table loading
export interface ClientListItem {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  eligibilityStatus: EligibilityStatus
  estimatedDbr?: number
  estimatedLtv?: number
  maxLoanAmount?: number
  sourceId?: string
  sourceDisplay?: string
  sourceSlaMin?: number
  sourceCampaign?: string
  status: ClientStatus
  createdAt: string
  updatedAt?: string
  documentsCount: string
  caseId?: ClientCase[] // List of cases with bank info if client has cases
  hasActivity?: boolean // True if any action has been taken (call, note, status change)
}

// Detail view - full data with activity
export interface Client {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  residencyStatus: ResidencyStatus
  dateOfBirth?: string
  nationality?: string
  employmentStatus: EmploymentStatus
  monthlySalary: number
  monthlyLiabilities?: number
  loanAmount?: number
  estimatedPropertyValue?: number
  eligibilityStatus: EligibilityStatus
  estimatedDbr?: number
  estimatedLtv?: number
  maxLoanAmount?: number
  sourceId?: string
  sourceDisplay?: string
  sourceCampaign?: string
  status: ClientStatus
  statusReason?: string
  createdAt: string
  updatedAt?: string
  documents: Document[]
  callLogs: CallLog[]
  notes: Note[]
  statusChanges: ClientStatusChange[]
  cases: ClientCase[]
}

export interface ClientFilters {
  sourceId?: string
  campaign?: string
  channel?: string
  status?: ClientStatus
  eligibility?: EligibilityStatus
  search?: string
}

export interface CreateCaseData {
  caseType: 'residential' | 'commercial'
  serviceType: 'assisted' | 'fullyPackaged'
  applicationType: 'individual' | 'joint'
  mortgageType: 'islamic' | 'conventional'
  emirate: 'abuDhabi' | 'ajman' | 'dubai' | 'fujairah' | 'rak' | 'sharjah' | 'uaq'
  loanAmount: number
  transactionType: 'primaryPurchase' | 'resale' | 'buyoutEquity' | 'buyout' | 'equity'
  mortgageTermYears: number
  mortgageTermMonths?: number
  estimatedPropertyValue: number
  propertyStatus: 'ready' | 'underConstruction'
  bankProductIds?: number[]
}
