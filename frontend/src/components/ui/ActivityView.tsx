import { Phone, StickyNote, ArrowRight, UserPlus, XCircle } from 'lucide-react'


interface CallLog {
  id: number
  outcome: 'connected' | 'noAnswer' | 'busy' | 'wrongNumber' | 'switchedOff'
  timestamp: string
  notes?: string
}

interface Note {
  id: number
  content: string
  timestamp: string
}

interface StatusChange {
  id: number
  type: 'converted_from_lead' | 'converted_to_client' | 'converted_to_case' | 'dropped' | 'not_eligible' | 'not_proceeding'
  timestamp: string
  notes?: string
}

interface ActivityViewProps {
  entityType: 'lead' | 'client' | 'case'
  createdAt: string
  notes?: Note[]
  callLogs?: CallLog[]
  statusChanges?: StatusChange[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hr ago`
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

const outcomeLabels: Record<string, string> = {
  connected: 'Connected',
  noAnswer: 'No Answer',
  busy: 'Busy',
  wrongNumber: 'Wrong Number',
  switchedOff: 'Switched Off',
}

const statusChangeLabels: Record<string, string> = {
  converted_from_lead: 'Converted from Lead',
  converted_to_client: 'Converted to Client',
  converted_to_case: 'Converted to Case',
  dropped: 'Dropped',
  not_eligible: 'Marked Not Eligible',
  not_proceeding: 'Marked Not Proceeding',
}

type ActivityItem =
  | { type: 'call'; data: CallLog }
  | { type: 'note'; data: Note }
  | { type: 'status'; data: StatusChange }
  | { type: 'created'; data: { timestamp: string; entityType: string } }

export function ActivityView({ entityType, createdAt, notes = [], callLogs = [], statusChanges = [] }: ActivityViewProps) {
  // Combine all activities and sort by timestamp (newest first)
  const activities: ActivityItem[] = [
    ...callLogs.map(c => ({ type: 'call' as const, data: c })),
    ...notes.map(n => ({ type: 'note' as const, data: n })),
    ...statusChanges.map(s => ({ type: 'status' as const, data: s })),
    { type: 'created' as const, data: { timestamp: createdAt, entityType } },
  ].sort((a, b) => {
    const timeA = new Date('timestamp' in a.data ? a.data.timestamp : createdAt).getTime()
    const timeB = new Date('timestamp' in b.data ? b.data.timestamp : createdAt).getTime()
    return timeB - timeA
  })

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-4">
        {activities.map((activity) => {
          if (activity.type === 'call') {
            const call = activity.data
            const isConnected = call.outcome === 'connected'
            return (
              <div key={`call-${call.id}`} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isConnected
                    ? 'bg-blue-100 dark:bg-blue-900/40'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <Phone className={`w-4 h-4 ${
                    isConnected
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Call - {outcomeLabels[call.outcome] || call.outcome}
                  </p>
                  {call.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{call.notes}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatRelativeTime(call.timestamp)}
                  </p>
                </div>
              </div>
            )
          }

          if (activity.type === 'note') {
            const note = activity.data
            return (
              <div key={`note-${note.id}`} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatRelativeTime(note.timestamp)}
                  </p>
                </div>
              </div>
            )
          }

          if (activity.type === 'status') {
            const status = activity.data
            const isPositive = status.type.includes('converted')
            return (
              <div key={`status-${status.id}`} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {isPositive ? (
                    <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    isPositive
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {statusChangeLabels[status.type] || status.type}
                  </p>
                  {status.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{status.notes}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatRelativeTime(status.timestamp)}
                  </p>
                </div>
              </div>
            )
          }

          if (activity.type === 'created') {
            return (
              <div key="created" className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {entityType.charAt(0).toUpperCase() + entityType.slice(1)} created
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatRelativeTime(activity.data.timestamp)}
                  </p>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
