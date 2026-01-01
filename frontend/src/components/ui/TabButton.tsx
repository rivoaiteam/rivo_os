interface TabButtonProps {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}

export function TabButton({ active, onClick, count, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 text-sm font-medium transition-colors border-b-2
        ${active
          ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }
      `}
    >
      {children}
      <span className="ml-1.5 text-xs text-slate-400">{count ?? '-'}</span>
    </button>
  )
}
