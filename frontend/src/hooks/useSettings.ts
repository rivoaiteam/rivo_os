/**
 * React Query hooks for Settings (Sources, SubSources, Users, Bank Products, EIBOR Rates, System Settings)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sourcesApi, subSourcesApi, usersApi, bankProductsApi, eiborRatesApi, systemSettingsApi } from '@/api/settings'
import type { FixedChannelType, SystemSettings, BankProductFilters } from '@/types/settings'

// System Settings
export const SYSTEM_SETTINGS_QUERY_KEY = ['system-settings']

export function useSystemSettings() {
  return useQuery({
    queryKey: SYSTEM_SETTINGS_QUERY_KEY,
    queryFn: systemSettingsApi.get,
  })
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SystemSettings>) => systemSettingsApi.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SYSTEM_SETTINGS_QUERY_KEY }),
  })
}

// Sources
export const SOURCES_QUERY_KEY = ['sources']

export function useSources(channelId?: FixedChannelType) {
  return useQuery({
    queryKey: [...SOURCES_QUERY_KEY, channelId],
    queryFn: () => sourcesApi.list(channelId),
  })
}

export function useCreateSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sourcesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_QUERY_KEY }),
  })
}

export function useUpdateSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof sourcesApi.update>[1] }) =>
      sourcesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_QUERY_KEY }),
  })
}

export function useDeleteSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sourcesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_QUERY_KEY }),
  })
}

// SubSources
export const SUB_SOURCES_QUERY_KEY = ['sub-sources']

export function useSubSources(sourceId?: string) {
  return useQuery({
    queryKey: [...SUB_SOURCES_QUERY_KEY, sourceId],
    queryFn: () => subSourcesApi.list(sourceId),
  })
}

export function useCreateSubSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: subSourcesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUB_SOURCES_QUERY_KEY }),
  })
}

export function useUpdateSubSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof subSourcesApi.update>[1] }) =>
      subSourcesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUB_SOURCES_QUERY_KEY }),
  })
}

export function useDeleteSubSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: subSourcesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUB_SOURCES_QUERY_KEY }),
  })
}

// Users
export const USERS_QUERY_KEY = ['users']

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: usersApi.list,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  })
}

// Bank Products
export const BANK_PRODUCTS_QUERY_KEY = ['bank-products']

export function useBankProducts(filters?: BankProductFilters) {
  return useQuery({
    queryKey: [...BANK_PRODUCTS_QUERY_KEY, filters],
    queryFn: () => bankProductsApi.list(filters),
  })
}

export function useCreateBankProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bankProductsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_PRODUCTS_QUERY_KEY }),
  })
}

export function useUpdateBankProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof bankProductsApi.update>[1] }) =>
      bankProductsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_PRODUCTS_QUERY_KEY }),
  })
}

export function useDeleteBankProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bankProductsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BANK_PRODUCTS_QUERY_KEY }),
  })
}

// EIBOR Rates
export const EIBOR_RATES_QUERY_KEY = ['eibor-rates']

export function useEiborRatesLatest() {
  return useQuery({
    queryKey: [...EIBOR_RATES_QUERY_KEY, 'latest'],
    queryFn: eiborRatesApi.getLatest,
  })
}