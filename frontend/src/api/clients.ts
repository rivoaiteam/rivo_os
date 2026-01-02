/**
 * Clients API
 */

import api from './client'
import type { Client, ClientListItem, ClientFilters, CallOutcome, DocumentType, CreateCaseData } from '@/types/clients'
import type { PaginatedResponse, PaginationParams } from '@/types/common'

export const clientsApi = {
  // Get paginated clients with optional filters
  async list(filters?: ClientFilters & PaginationParams): Promise<PaginatedResponse<ClientListItem>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.eligibility) params.append('eligibility', filters.eligibility)
    if (filters?.campaign) params.append('campaign', filters.campaign)
    if (filters?.channel) params.append('channel', filters.channel)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.pageSize) params.append('page_size', filters.pageSize.toString())

    const response = await api.get<PaginatedResponse<ClientListItem>>(`/clients/?${params.toString()}`)
    return response.data
  },

  // Get single client
  async get(id: number): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}/`)
    return response.data
  },

  // Create client
  async create(data: {
    firstName: string
    lastName: string
    email?: string
    phone: string
    residencyStatus?: string
    dateOfBirth?: string
    nationality?: string
    employmentStatus?: string
    monthlySalary?: number
    monthlyLiabilities?: number
    loanAmount?: number
    estimatedPropertyValue?: number
    sourceChannel: string
    sourceCampaignId?: number
  }): Promise<Client> {
    const response = await api.post<Client>('/clients/', data)
    return response.data
  },

  // Update client
  async update(id: number, data: Partial<Client>): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}/`, data)
    return response.data
  },

  // Log call
  async logCall(id: number, outcome: CallOutcome, notes?: string): Promise<void> {
    await api.post(`/clients/${id}/log_call/`, { outcome, notes })
  },

  // Add note
  async addNote(id: number, content: string): Promise<void> {
    await api.post(`/clients/${id}/add_note/`, { content })
  },

  // Upload document with file
  async uploadDocument(id: number, type: DocumentType, file: File): Promise<{ id: number; type: string; status: string; fileUrl: string; uploadedAt: string }> {
    const formData = new FormData()
    formData.append('type', type)
    formData.append('file', file)
    // Don't manually set Content-Type - axios will set it with proper boundary for FormData

    const response = await api.post<{ id: number; type: string; status: string; fileUrl: string; uploadedAt: string }>(
      `/clients/${id}/upload_document/`,
      formData
    )
    return response.data
  },

  // Delete document
  async deleteDocument(clientId: number, documentId: number): Promise<void> {
    await api.post(`/clients/${clientId}/delete_document/${documentId}/`)
  },

  // Mark withdrawn
  async markNotProceeding(id: number, notes?: string): Promise<Client> {
    const response = await api.post<Client>(`/clients/${id}/mark_not_proceeding/`, { notes })
    return response.data
  },

  // Mark not eligible
  async markNotEligible(id: number, notes?: string): Promise<Client> {
    const response = await api.post<Client>(`/clients/${id}/mark_not_eligible/`, { notes })
    return response.data
  },

  // Create case from client (uses defaults if no data provided)
  async createCase(id: number, data?: Partial<CreateCaseData>): Promise<{ client: Client; caseId: number; caseNumber: string }> {
    const response = await api.post<{ client: Client; caseId: number; caseNumber: string }>(`/clients/${id}/create_case/`, data || {})
    return response.data
  },
}
