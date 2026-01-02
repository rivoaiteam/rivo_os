/**
 * Leads API
 */

import api from './client'
import type { Lead, LeadFilters, CallOutcome } from '@/types/leads'
import type { PaginatedResponse, PaginationParams } from '@/types/common'

export const leadsApi = {
  // Get paginated leads with optional filters
  async list(filters?: LeadFilters & PaginationParams): Promise<PaginatedResponse<Lead>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.pageSize) params.append('page_size', filters.pageSize.toString())

    const response = await api.get<PaginatedResponse<Lead>>(`/leads/?${params.toString()}`)
    return response.data
  },

  // Get single lead
  async get(id: number): Promise<Lead> {
    const response = await api.get<Lead>(`/leads/${id}/`)
    return response.data
  },

  // Create lead
  async create(data: {
    firstName: string
    lastName: string
    email?: string
    phone: string
    sourceId?: string
    intent: string
    transcript?: string
  }): Promise<Lead> {
    const response = await api.post<Lead>('/leads/', data)
    return response.data
  },

  // Update lead
  async update(id: number, data: Partial<Lead>): Promise<Lead> {
    const response = await api.patch<Lead>(`/leads/${id}/`, data)
    return response.data
  },

  // Log call
  async logCall(id: number, outcome: CallOutcome, notes?: string): Promise<void> {
    await api.post(`/leads/${id}/log_call/`, { outcome, notes })
  },

  // Add note
  async addNote(id: number, content: string): Promise<void> {
    await api.post(`/leads/${id}/add_note/`, { content })
  },

  // Mark lead as not eligible
  async drop(id: number, notes?: string): Promise<Lead> {
    const response = await api.post<Lead>(`/leads/${id}/drop/`, { notes })
    return response.data
  },

  // Convert lead to client
  async convert(id: number, notes?: string): Promise<{ lead: Lead; clientId: number }> {
    const response = await api.post<{ lead: Lead; clientId: number }>(`/leads/${id}/convert/`, { notes })
    return response.data
  },
}
