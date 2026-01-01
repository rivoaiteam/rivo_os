/**
 * Lead Types
 */

import type { Note, CallOutcome, CallLog } from './common'

export type { Note, CallOutcome, CallLog }

export type LeadStatus = 'new' | 'dropped' | 'converted'

export interface StatusChange {
  id: number
  type: 'converted_to_client' | 'dropped'
  notes?: string
  timestamp: string
}

export interface Lead {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  sourceDisplay?: string
  sourceSlaMin?: number
  hasActivity?: boolean
  intent: string
  status: LeadStatus
  transcript?: string
  createdAt: string
  updatedAt?: string
  callLogs: CallLog[]
  notes?: Note[]
  statusChanges?: StatusChange[]
  convertedClientId?: number
}

export interface LeadFilters {
  source?: string
  status?: LeadStatus
  search?: string
}
