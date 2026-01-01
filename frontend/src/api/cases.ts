/**
 * Cases API
 */

import api from './client'
import type { Case, CaseListItem, CaseFilters, CallOutcome, BankFormType, CreateCaseData } from '@/types/cases'

export const casesApi = {
  // Get all cases with optional filters (minimal list data)
  async list(filters?: CaseFilters): Promise<CaseListItem[]> {
    const params = new URLSearchParams()
    if (filters?.stage) params.append('stage', filters.stage)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.client) params.append('client', filters.client.toString())
    if (filters?.search) params.append('search', filters.search)

    const response = await api.get<CaseListItem[]>(`/cases/?${params.toString()}`)
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
