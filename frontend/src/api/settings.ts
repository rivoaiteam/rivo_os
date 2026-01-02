/**
 * Settings API - matches database schema
 */

import api from './client'
import type { Source, SubSource, User, BankProduct, BankProductFilters, EiborRatesLatest, FixedChannelType, SystemSettings } from '@/types/settings'
import type { PaginatedResponse } from '@/types/common'

// System Settings API
export const systemSettingsApi = {
  async get(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>('/system-settings/')
    return response.data
  },

  async update(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.patch<SystemSettings>('/system-settings/', data)
    return response.data
  },
}

// Sources API - matches source table (no status)
export const sourcesApi = {
  async list(channelId?: FixedChannelType): Promise<Source[]> {
    const params = channelId ? { channel_id: channelId } : {}
    const response = await api.get<Source[]>('/sources/', { params })
    return response.data
  },

  async create(data: {
    channelId: FixedChannelType
    name: string
    contactPhone?: string
  }): Promise<Source> {
    const response = await api.post<Source>('/sources/', {
      channelId: data.channelId,
      name: data.name,
      contactPhone: data.contactPhone,
    })
    return response.data
  },

  async update(id: string, data: Partial<Omit<Source, 'id' | 'channelId'>>): Promise<Source> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.contactPhone !== undefined) payload.contactPhone = data.contactPhone
    const response = await api.patch<Source>(`/sources/${id}/`, payload)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/sources/${id}/`)
  },
}

// SubSources API - matches sub_source table with status and SLA
export const subSourcesApi = {
  async list(sourceId?: string): Promise<SubSource[]> {
    const params = sourceId ? { source_id: sourceId } : {}
    const response = await api.get<SubSource[]>('/sub-sources/', { params })
    return response.data
  },

  async create(data: {
    sourceId: string
    name: string
    contactPhone?: string
    status?: string
    defaultSlaMin?: number
  }): Promise<SubSource> {
    const response = await api.post<SubSource>('/sub-sources/', {
      sourceId: data.sourceId,
      name: data.name,
      contactPhone: data.contactPhone,
      status: data.status ?? 'active',
      defaultSlaMin: data.defaultSlaMin,
    })
    return response.data
  },

  async update(id: string, data: Partial<Omit<SubSource, 'id' | 'sourceId'>> & { defaultSlaMin?: number | null }): Promise<SubSource> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.contactPhone !== undefined) payload.contactPhone = data.contactPhone
    if (data.status !== undefined) payload.status = data.status
    if ('defaultSlaMin' in data) payload.defaultSlaMin = data.defaultSlaMin
    const response = await api.patch<SubSource>(`/sub-sources/${id}/`, payload)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/sub-sources/${id}/`)
  },
}

// Users API
export const usersApi = {
  async list(): Promise<User[]> {
    const response = await api.get<User[]>('/users/')
    return response.data
  },

  async create(data: {
    username: string
    email: string
    firstName: string
    lastName: string
    password: string
    status?: string
  }): Promise<User> {
    const response = await api.post<User>('/users/', data)
    return response.data
  },

  async update(id: number, data: Partial<User & { password?: string }>): Promise<User> {
    const response = await api.patch<User>(`/users/${id}/`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}/`)
  },
}

// Bank Products API
export const bankProductsApi = {
  async list(filters?: BankProductFilters): Promise<PaginatedResponse<BankProduct>> {
    const params: Record<string, string> = {}
    if (filters?.isActive !== undefined) params.is_active = String(filters.isActive)
    if (filters?.bankName) params.bank_name = filters.bankName
    if (filters?.mortgageType) params.mortgage_type = filters.mortgageType
    if (filters?.employmentType) params.employment_type = filters.employmentType
    if (filters?.transactionType) params.transaction_type = filters.transactionType
    if (filters?.residency) params.residency = filters.residency
    if (filters?.rateType) params.rate_type = filters.rateType
    if (filters?.isExclusive !== undefined) params.is_exclusive = String(filters.isExclusive)
    if (filters?.ltvMin !== undefined) params.ltv_min = String(filters.ltvMin)
    if (filters?.page !== undefined) params.page = String(filters.page)
    if (filters?.pageSize !== undefined) params.page_size = String(filters.pageSize)
    const response = await api.get<PaginatedResponse<BankProduct>>('/bank-products/', { params })
    return response.data
  },

  async get(id: number): Promise<BankProduct> {
    const response = await api.get<BankProduct>(`/bank-products/${id}/`)
    return response.data
  },

  async create(data: Partial<BankProduct>): Promise<BankProduct> {
    const response = await api.post<BankProduct>('/bank-products/', data)
    return response.data
  },

  async update(id: number, data: Partial<BankProduct>): Promise<BankProduct> {
    const response = await api.patch<BankProduct>(`/bank-products/${id}/`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/bank-products/${id}/`)
  },
}

// EIBOR Rates API
export const eiborRatesApi = {
  async getLatest(): Promise<EiborRatesLatest> {
    const response = await api.get<EiborRatesLatest>('/eibor-rates/latest/')
    return response.data
  },
}