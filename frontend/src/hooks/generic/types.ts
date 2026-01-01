/**
 * Generic Hook Types
 *
 * Shared type definitions for generic entity hooks
 */

import type { CallOutcome, CallLog, Note } from '@/types/common'

export type EntityType = 'lead' | 'client' | 'case'

// Query key configuration per entity type
export const ENTITY_QUERY_KEYS: Record<EntityType, string[]> = {
  lead: ['leads'],
  client: ['clients'],
  case: ['cases'],
}

// Entity with activity data (common fields across all entities)
export interface EntityWithActivity {
  id: number
  callLogs: CallLog[]
  notes: Note[]
}

// Input types for mutations
export interface LogCallInput {
  entityId: number
  outcome: CallOutcome
  notes?: string
}

export interface AddNoteInput {
  entityId: number
  content: string
}

export interface UpdateStatusInput {
  entityId: number
  status: string
  reason?: string
  notes?: string
}

// Re-export for convenience
export type { CallOutcome, CallLog, Note }