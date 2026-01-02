/**
 * Cases API
 */

import api from './client'
import type { Case, CaseListItem, CaseFilters, CallOutcome, BankFormType, CreateCaseData } from '@/types/cases'
import type { PaginatedResponse, PaginationParams } from '@/types/common'

export const casesApi = {
  // Get paginated cases with optional filters
  async list(filters?: CaseFilters & PaginationParams): Promise<PaginatedResponse<CaseListItem>> {
    const params = new URLSearchParams()
    if (filters?.stage) params.append('stage', filters.stage)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.client) params.append('client', filters.client.toString())
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.pageSize) params.append('page_size', filters.pageSize.toString())

    const response = await api.get<PaginatedResponse<CaseListItem>>(`/cases/?${params.toString()}`)
    return response.data
  },

  // Get single case
  async get(id: number): Promise<Case> {
    const response = await api.get<Case>(`/cases/${id}/`)
    return response.data
  },

  // Create case
  async create(data: CreateCaseData): Promise<Case> {
    const response = await api.post<Case>('/cases/', data)
    return response.data
  },

  // Update case
  async update(id: number, data: Partial<Case>): Promise<Case> {
    const response = await api.patch<Case>(`/cases/${id}/`, data)
    return response.data
  },

  // Log call
  async logCall(id: number, outcome: CallOutcome, notes?: string): Promise<void> {
    await api.post(`/cases/${id}/log_call/`, { outcome, notes })
  },

  // Add note
  async addNote(id: number, content: string): Promise<void> {
    await api.post(`/cases/${id}/add_note/`, { content })
  },

  // Upload bank form
  async uploadBankForm(id: number, type: BankFormType, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('type', type)
    formData.append('file', file)
    // Don't manually set Content-Type - axios will set it with proper boundary for FormData
    await api.post(`/cases/${id}/upload_bank_form/`, formData)
  },

  // Delete bank form
  async deleteBankForm(caseId: number, formId: number): Promise<void> {
    await api.post(`/cases/${caseId}/delete_bank_form/${formId}/`)
  },

  // Advance stage
  async advanceStage(id: number, notes?: string): Promise<Case> {
    const response = await api.post<Case>(`/cases/${id}/advance_stage/`, { notes })
    return response.data
  },

  // Decline case
  async decline(id: number, reason: string): Promise<Case> {
    const response = await api.post<Case>(`/cases/${id}/decline/`, { reason })
    return response.data
  },

  // Withdraw case
  async withdraw(id: number, reason: string): Promise<Case> {
    const response = await api.post<Case>(`/cases/${id}/withdraw/`, { reason })
    return response.data
  },

  // Set stage directly (for drag and drop)
  async setStage(id: number, stage: string, notes?: string): Promise<Case> {
    const response = await api.post<Case>(`/cases/${id}/set_stage/`, { stage, notes })
    return response.data
  },
}
