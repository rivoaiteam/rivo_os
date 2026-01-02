interface SectionHeaderProps {
  children: React.ReactNode
  action?: React.ReactNode
}

export function SectionHeader({ children, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {children}
      </h3>
      {action}
    </div>
  )
}

interface InfoFieldProps {
  label: string
  value: string | null | undefined
  isEditing?: boolean
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  className?: string
}

export function InfoField({ label, value, isEditing, onChange, type = 'text', className = '' }: InfoFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {isEditing && onChange ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
      )}
    </div>
  )
}

interface InfoTextAreaProps {
  label: string
  value: string | null | undefined
  isEditing?: boolean
  onChange?: (value: string) => void
  rows?: number
}

export function InfoTextArea({ label, value, isEditing, onChange, rows = 2 }: InfoTextAreaProps) {
  return (
    <div>
      <SectionHeader>{label}</SectionHeader>
      {isEditing && onChange ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <p className="text-sm text-slate-700">"{value || '—'}"</p>
      )}
    </div>
  )
}
