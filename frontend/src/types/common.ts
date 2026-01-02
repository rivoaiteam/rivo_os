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

// Paginated API response
export interface PaginatedResponse<T> {
  count: number
  totalPages: number
  currentPage: number
  pageSize: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}
