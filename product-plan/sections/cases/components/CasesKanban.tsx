import type { Case, CaseStage, ClientSummary, Bank } from '@/../product/sections/cases/types'
import {
  CASE_STAGE_LABELS,
  MORTGAGE_TYPE_LABELS,
  ACTIVE_STAGES,
} from '@/../product/sections/cases/types'

interface CasesKanbanProps {
  cases: Case[]
  clients: ClientSummary[]
  banks: Bank[]
  selectedCaseId?: string
  onSelectCase?: (id: string) => void
}

const stageColumnConfig: Record<CaseStage, { headerBg: string; headerText: string }> = {
  processing: { headerBg: 'bg-amber-50 dark:bg-amber-900/20', headerText: 'text-amber-700 dark:text-amber-300' },
  submitted: { headerBg: 'bg-blue-50 dark:bg-blue-900/20', headerText: 'text-blue-700 dark:text-blue-300' },
  underReview: { headerBg: 'bg-blue-50 dark:bg-blue-900/20', headerText: 'text-blue-700 dark:text-blue-300' },
  preApproved: { headerBg: 'bg-emerald-50 dark:bg-emerald-900/20', headerText: 'text-emerald-700 dark:text-emerald-300' },
  valuation: { headerBg: 'bg-purple-50 dark:bg-purple-900/20', headerText: 'text-purple-700 dark:text-purple-300' },
  folProcessing: { headerBg: 'bg-purple-50 dark:bg-purple-900/20', headerText: 'text-purple-700 dark:text-purple-300' },
  folReceived: { headerBg: 'bg-emerald-50 dark:bg-emerald-900/20', headerText: 'text-emerald-700 dark:text-emerald-300' },
  folSigned: { headerBg: 'bg-emerald-50 dark:bg-emerald-900/20', headerText: 'text-emerald-700 dark:text-emerald-300' },
  disbursed: { headerBg: 'bg-emerald-50 dark:bg-emerald-900/20', headerText: 'text-emerald-700 dark:text-emerald-300' },
  declined: { headerBg: 'bg-red-50 dark:bg-red-900/20', headerText: 'text-red-700 dark:text-red-300' },
  withdrawn: { headerBg: 'bg-slate-50 dark:bg-slate-800', headerText: 'text-slate-600 dark:text-slate-400' },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return '1d'
  return `${diffDays}d`
}

export function CasesKanban({
  cases,
  clients,
  banks,
  selectedCaseId,
  onSelectCase,
}: CasesKanbanProps) {
  const getClient = (clientId: string) => clients.find(c => c.id === clientId)
  const getBankName = (bankId: string) => banks.find(b => b.id === bankId)?.name || bankId

  // Group cases by stage (only active stages for kanban)
  const casesByStage = ACTIVE_STAGES.reduce((acc, stage) => {
    acc[stage] = cases.filter(c => c.stage === stage)
    return acc
  }, {} as Record<CaseStage, Case[]>)

  // Get last activity time for sorting within column
  const getLastActivityTime = (caseItem: Case): number => {
    const callTimes = caseItem.callLogs?.map(c => new Date(c.timestamp).getTime()) || []
    const noteTimes = caseItem.notes?.map(n => new Date(n.timestamp).getTime()) || []
    const stageTimes = caseItem.stageChanges?.map(s => new Date(s.timestamp).getTime()) || []
    const allTimes = [...callTimes, ...noteTimes, ...stageTimes]
    return allTimes.length > 0 ? Math.max(...allTimes) : new Date(caseItem.createdAt).getTime()
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 p-4 h-full min-w-max">
        {ACTIVE_STAGES.map((stage) => {
          const stageCases = casesByStage[stage] || []
          const config = stageColumnConfig[stage]

          // Sort cases by most recent activity
          const sortedCases = [...stageCases].sort((a, b) =>
            getLastActivityTime(b) - getLastActivityTime(a)
          )

          return (
            <div
              key={stage}
              className="flex flex-col w-72 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${config.headerBg}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${config.headerText}`}>
                  {CASE_STAGE_LABELS[stage]}
                </h3>
                <span className={`text-xs font-medium ${config.headerText} opacity-70`}>
                  {stageCases.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {sortedCases.map((caseItem) => {
                  const client = getClient(caseItem.clientId)
                  const isSelected = caseItem.id === selectedCaseId
                  const primaryBank = getBankName(caseItem.bankSelection[0])
                  const lastActivity = getLastActivityTime(caseItem)

                  return (
                    <div
                      key={caseItem.id}
                      onClick={() => onSelectCase?.(caseItem.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        bg-white dark:bg-slate-800 border
                        hover:shadow-md hover:-translate-y-0.5
                        ${isSelected
                          ? 'border-blue-500 ring-1 ring-blue-500 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }
                      `}
                    >
                      {/* Client Name + Case ID */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                            {client ? `${client.firstName} ${client.lastName}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {caseItem.caseId}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {formatRelativeTime(new Date(lastActivity).toISOString())}
                        </span>
                      </div>

                      {/* Bank + Amount */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {primaryBank}
                          {caseItem.bankSelection.length > 1 && (
                            <span className="text-slate-400 ml-1">+{caseItem.bankSelection.length - 1}</span>
                          )}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 flex-shrink-0">
                          {formatCurrency(caseItem.loanAmount)}
                        </span>
                      </div>

                      {/* Mortgage Type Badge */}
                      <div className="mt-2">
                        <span className="inline-flex px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {MORTGAGE_TYPE_LABELS[caseItem.mortgageType]}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Empty State */}
                {sortedCases.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-slate-400 dark:text-slate-500">
                    No cases
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}