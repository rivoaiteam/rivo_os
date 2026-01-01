/**
 * Common Types - Shared across leads, clients, and cases
 */

export type CallOutcome = 'connected' | 'noAnswer'

export interface CallLog {
  id: number
  outcome: CallOutcome
  notes?: string
  timestamp: string
}

export interface Note {
  id: number
  content: string
  timestamp: string
}
