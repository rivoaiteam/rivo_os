import { Edit3, Trash2, X, Check, ChevronDown } from 'lucide-react'

// ============================================================================
// Status Badge with Dropdown
// ============================================================================

interface StatusOption<T extends string> {
  value: T
  label: string
  bg: string
  text: string
}

interface StatusBadgeProps<T extends string> {
  currentStatus: T
  options: StatusOption<T>[]
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onChange: (status: T) => void
}

export function StatusBadge<T extends string>({
  currentStatus,
  options,
  isOpen,
  onToggle,
  onClose,
  onChange,
}: StatusBadgeProps<T>) {
  const currentOption = options.find((opt) => opt.value === currentStatus)
  if (!currentOption) return null

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${currentOption.bg} ${currentOption.text} hover:opacity-80 transition-opacity cursor-pointer`}
      >
        {currentOption.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 min-w-[100px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  currentStatus === option.value ? 'font-medium' : ''
                } ${option.text}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Action Buttons
// ============================================================================

interface ActionButtonsProps {
  onEdit: () => void
  onDelete: () => void
}

export function ActionButtons({ onEdit, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={onEdit}
        className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        title="Edit"
      >
        <Edit3 className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

// ============================================================================
// Edit Mode Action Buttons
// ============================================================================

interface EditActionButtonsProps {
  onSave: () => void
  onCancel: () => void
  disabled?: boolean
}

export function EditActionButtons({ onSave, onCancel, disabled }: EditActionButtonsProps) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={onSave}
        disabled={disabled}
        className="p-1.5 text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 dark:disabled:text-slate-600 transition-colors"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================================
// Format Date Utility
// ============================================================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
      {message}
    </div>
  )
}
