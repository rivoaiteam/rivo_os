/**
 * Generic Entity API
 *
 * Provides unified API access for common entity operations (logCall, addNote, updateStatus)
 * Entity-specific APIs (leads, clients, cases) still handle their unique operations.
 */

import api from './client'
import type { CallOutcome } from '@/types/common'

export type EntityType = 'lead' | 'client' | 'case'

// Map entity type to API endpoint prefix
const ENTITY_ENDPOINTS: Record<EntityType, string> = {
  lead: '/leads',
  client: '/clients',
  case: '/cases',
}

export const entityApi = {
  /**
   * Log a call for any entity
   */
  async logCall(
    entityType: EntityType,
    entityId: number,
    outcome: CallOutcome,
    notes?: string
  ): Promise<void> {
    const endpoint = ENTITY_ENDPOINTS[entityType]
    await api.post(`${endpoint}/${entityId}/log_call/`, { outcome, notes })
  },

  /**
   * Add a note to any entity
   */
  async addNote(
    entityType: EntityType,
    entityId: number,
    content: string
  ): Promise<void> {
    const endpoint = ENTITY_ENDPOINTS[entityType]
    await api.post(`${endpoint}/${entityId}/add_note/`, { content })
  },

  /**
   * Update status (terminal state) for leads and clients
   * For cases, use move-stage endpoint instead
   */
  async updateStatus(
    entityType: 'lead' | 'client',
    entityId: number,
    status: string,
    _reason?: string,
    notes?: string
  ): Promise<unknown> {
    const endpoint = ENTITY_ENDPOINTS[entityType]

    if (entityType === 'lead') {
      // Lead terminal status is 'dropped'
      if (status === 'dropped') {
        const response = await api.post(`${endpoint}/${entityId}/drop/`, { notes })
        return response.data
      }
    } else if (entityType === 'client') {
      // Client terminal statuses
      if (status === 'notEligible') {
        const response = await api.post(`${endpoint}/${entityId}/mark_not_eligible/`, { notes })
        return response.data
      }
      if (status === 'notProceeding') {
        const response = await api.post(`${endpoint}/${entityId}/mark_not_proceeding/`, { notes })
        return response.data
      }
    }

    throw new Error(`Unsupported status update: ${status} for ${entityType}`)
  },

  /**
   * Update case status (terminal states: declined, withdrawn)
   * Note: 'disbursed' is reached via stage progression (useMoveStage), not status update
   */
  async updateCaseStatus(
    caseId: number,
    status: 'declined' | 'withdrawn' | 'disbursed',
    notes?: string
  ): Promise<unknown> {
    const endpoint = ENTITY_ENDPOINTS.case

    if (status === 'declined') {
      const response = await api.post(`${endpoint}/${caseId}/decline/`, { reason: notes })
      return response.data
    }
    if (status === 'withdrawn') {
      const response = await api.post(`${endpoint}/${caseId}/withdraw/`, { reason: notes })
      return response.data
    }
    if (status === 'disbursed') {
      const response = await api.post(`${endpoint}/${caseId}/move_stage/`, { stage: 'disbursed', notes })
      return response.data
    }

    throw new Error(`Unsupported case status: ${status}`)
  },
}