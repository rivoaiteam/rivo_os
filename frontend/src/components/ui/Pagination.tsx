import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationInfo {
  count: number
  totalPages: number
  currentPage: number
  pageSize: number
}

interface PaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
}: PaginationProps) {
  const { count, totalPages, currentPage, pageSize } = pagination

  if (count === 0) return null

  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      {/* Left side - Count info */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>{count} total</span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-sm border-0 bg-transparent text-slate-500 focus:ring-0 cursor-pointer -ml-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Right side - Page navigation */}
      <div className="flex items-center gap-1 text-sm text-slate-500">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}