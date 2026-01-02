import { useState, useCallback, useMemo } from 'react'
import type { PaginatedResponse } from '@/types/common'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetPage: () => void
  paginationFilters: { page: number; pageSize: number }
  // Helper to get pagination info from response
  getPaginationInfo: <T>(data: PaginatedResponse<T> | undefined) => {
    count: number
    totalPages: number
    currentPage: number
    pageSize: number
  } | null
  // Helper to create filter change handlers that reset page
  createFilterHandler: <T>(setter: (value: T) => void) => (value: T) => void
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 20 } = options

  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize)
    setPageState(1) // Reset to first page when page size changes
  }, [])

  const resetPage = useCallback(() => {
    setPageState(1)
  }, [])

  const paginationFilters = useMemo(() => ({
    page,
    pageSize,
  }), [page, pageSize])

  const getPaginationInfo = useCallback(<T>(data: PaginatedResponse<T> | undefined) => {
    if (!data) return null
    return {
      count: data.count,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      pageSize: data.pageSize,
    }
  }, [])

  // Creates a filter handler that resets page when filter changes
  const createFilterHandler = useCallback(<T>(setter: (value: T) => void) => {
    return (value: T) => {
      setter(value)
      setPageState(1)
    }
  }, [])

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
    paginationFilters,
    getPaginationInfo,
    createFilterHandler,
  }
}