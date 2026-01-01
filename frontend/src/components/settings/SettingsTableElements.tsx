import { Pencil, Trash2, X, Check } from 'lucide-react'

// ============================================================================
// Action Buttons
// ============================================================================

interface ActionButtonsProps {
  onEdit: () => void
  onDelete: () => void
}

export function ActionButtons({ onEdit, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={onEdit}
        className="p-1 text-slate-400 hover:text-slate-600"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 text-slate-400 hover:text-red-600"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
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
