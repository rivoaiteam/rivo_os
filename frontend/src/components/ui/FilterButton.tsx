import { ChevronDown } from 'lucide-react'

interface FilterButtonProps {
  label: string
  value?: string
  isOpen: boolean
  onClick: () => void
}

export function FilterButton({ label, value, isOpen, onClick }: FilterButtonProps) {
  const hasValue = !!value

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
        ${hasValue
          ? 'text-blue-600'
          : 'text-slate-500 hover:text-slate-700'
        }
      `}
    >
      {value || label}
      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  )
}
