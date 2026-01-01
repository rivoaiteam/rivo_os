interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  )
}
