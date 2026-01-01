import { useState, useMemo } from 'react'
import { Plus, Search, List, Kanban } from 'lucide-react'
import type {
  Case,
  CasesPageProps,
  CaseStage,
  CallOutcome,
} from '@/../product/sections/cases/types'
import {
  CASE_STAGE_LABELS,
  MORTGAGE_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  isTerminalStage,
} from '@/../product/sections/cases/types'
import { CaseSidePanel } from './CaseSidePanel'
import { CasesKanban } from './CasesKanban'
import { TabButton } from '@/components/TabButton'
import { InlineActions, NoteAction, PhoneAction, RowActionsDropdown } from '@/components/InlineActions'

type TabFilter = 'active' | 'all'
type ViewMode = 'list' | 'kanban'

const stageConfig: Record<CaseStage, { bg: string; text: string }> = {
  processing: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  submitted: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  underReview: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  preApproved: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  valuation: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  folProcessing: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  folReceived: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  folSigned: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  disbursed: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  declined: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
  withdrawn: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CasesList({
  cases,
  clients,
  banks,
  selectedCaseId,
  onSelectCase,
  onCloseSidePanel,
  onUpdateCase,
  onUploadBankForm,
  onLogCall,
  onAddNote,
  onAdvanceStage,
  onDecline,
  onWithdraw,
  onCreateCase,
  isCreateMode,
  onToggleCreateMode,
}: CasesPageProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('active')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [initialPanelTab, setInitialPanelTab] = useState<'deal' | 'activity'>('deal')

  const selectedCase = useMemo(() =>
    cases.find(c => c.id === selectedCaseId),
    [cases, selectedCaseId]
  )

  // Get the client for a case
  const getClient = (clientId: string) => clients.find(c => c.id === clientId)

  // Get the bank name
  const getBankName = (bankId: string) => banks.find(b => b.id === bankId)?.name || bankId

  // Get the most recent activity time for a case
  const getLastActivityTime = (caseItem: Case): number => {
    const callTimes = caseItem.callLogs?.map(c => new Date(c.timestamp).getTime()) || []
    const noteTimes = caseItem.notes?.map(n => new Date(n.timestamp).getTime()) || []
    const stageTimes = caseItem.stageChanges?.map(s => new Date(s.timestamp).getTime()) || []
    const allTimes = [...callTimes, ...noteTimes, ...stageTimes]
    return allTimes.length > 0 ? Math.max(...allTimes) : 0
  }

  // Get the most recent activity timestamp
  const getLastActivityTimestamp = (caseItem: Case): string | null => {
    const time = getLastActivityTime(caseItem)
    return time > 0 ? new Date(time).toISOString() : null
  }

  // Filter cases based on tab and search
  const filteredCases = useMemo(() => {
    let filtered = cases

    if (activeTab === 'active') {
      // Active = not terminal (not disbursed, declined, withdrawn)
      filtered = filtered.filter(c => !isTerminalStage(c.stage))
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => {
        const client = getClient(c.clientId)
        const fullName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : ''
        const matchesName = fullName.includes(query)
        const matchesCaseId = c.caseId.toLowerCase().includes(query)
        const matchesBank = c.bankSelection.some(bankId =>
          getBankName(bankId).toLowerCase().includes(query)
        )
        return matchesName || matchesCaseId || matchesBank
      })
    }

    // Sort based on tab
    if (activeTab === 'active') {
      // Active tab: sort by most recent stage change
      return filtered.sort((a, b) => {
        const aLastStage = a.stageChanges?.length
          ? new Date(a.stageChanges[a.stageChanges.length - 1].timestamp).getTime()
          : new Date(a.createdAt).getTime()
        const bLastStage = b.stageChanges?.length
          ? new Date(b.stageChanges[b.stageChanges.length - 1].timestamp).getTime()
          : new Date(b.createdAt).getTime()
        return bLastStage - aLastStage
      })
    } else {
      // All tab: sort by most recent activity
      return filtered.sort((a, b) => {
        const aActivity = getLastActivityTime(a)
        const bActivity = getLastActivityTime(b)
        if (aActivity !== bActivity) {
          return bActivity - aActivity
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
  }, [cases, activeTab, searchQuery, clients, banks])

  // Count by status for tabs
  const activeCount = cases.filter(c => !isTerminalStage(c.stage)).length
  const allCount = cases.length

  const isPanelOpen = !!selectedCaseId || !!isCreateMode

  return (
    <div className="h-full flex">
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isPanelOpen ? 'lg:mr-[50%]' : ''}`}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Cases
            </h1>
            <button
              onClick={() => onToggleCreateMode?.()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Create
            </button>
          </div>

          {/* Search + Tabs */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-9 pr-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
              <TabButton
                active={activeTab === 'active'}
                onClick={() => setActiveTab('active')}
                count={activeCount}
              >
                Active
              </TabButton>
              <TabButton
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                count={allCount}
              >
                All
              </TabButton>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Kanban view"
              >
                <Kanban className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Content - List or Kanban */}
        {viewMode === 'kanban' ? (
          <CasesKanban
            cases={filteredCases}
            clients={clients}
            banks={banks}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => {
              setInitialPanelTab('deal')
              onSelectCase?.(id)
            }}
          />
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Case
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredCases.map((caseItem) => {
                  const client = getClient(caseItem.clientId)
                  const stage = stageConfig[caseItem.stage]
                  const isSelected = caseItem.id === selectedCaseId
                  const isDimmed = isTerminalStage(caseItem.stage)
                  const isActive = !isDimmed
                  const lastActivityTimestamp = getLastActivityTimestamp(caseItem)
                  const primaryBank = getBankName(caseItem.bankSelection[0])

                  return (
                    <tr
                      key={caseItem.id}
                      onClick={() => {
                        setInitialPanelTab('deal')
                        onSelectCase?.(caseItem.id)
                      }}
                      className={`
                        cursor-pointer transition-colors
                        ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                        ${isDimmed ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Case: Client Name + Case ID */}
                      <td className="px-6 py-3 overflow-hidden align-middle">
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                          </div>
                          <div className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                            {caseItem.caseId}
                          </div>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${stage.bg} ${stage.text}`}>
                          {CASE_STAGE_LABELS[caseItem.stage]}
                        </span>
                      </td>

                      {/* Bank: Primary bank + mortgage type */}
                      <td className="px-4 py-3 overflow-hidden align-middle">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                            {primaryBank}
                            {caseItem.bankSelection.length > 1 && (
                              <span className="text-slate-400 dark:text-slate-500 ml-1">
                                +{caseItem.bankSelection.length - 1}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {MORTGAGE_TYPE_LABELS[caseItem.mortgageType]}
                          </div>
                        </div>
                      </td>

                      {/* Deal: Loan amount + transaction type */}
                      <td className="px-4 py-3 overflow-hidden align-middle">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {formatCurrency(caseItem.loanAmount)}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {TRANSACTION_TYPE_LABELS[caseItem.transactionType]}
                          </div>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {lastActivityTimestamp
                            ? formatRelativeTime(lastActivityTimestamp)
                            : '-'}
                        </span>
                      </td>

                      {/* Inline Actions */}
                      <td className="px-4 py-3 align-middle">
                        <InlineActions>
                          <NoteAction
                            onAddNote={(content) => {
                              onAddNote?.(caseItem.id, content)
                              setInitialPanelTab('activity')
                              onSelectCase?.(caseItem.id)
                            }}
                          />
                          <PhoneAction
                            phone={client?.phone || ''}
                            onLogCall={(outcome: CallOutcome, notes?: string) => {
                              onLogCall?.(caseItem.id, outcome, notes)
                              setInitialPanelTab('activity')
                              onSelectCase?.(caseItem.id)
                            }}
                          />
                          {isActive && (
                            <RowActionsDropdown
                              actions={[
                                {
                                  label: 'Advance',
                                  onClick: (notes) => {
                                    onAdvanceStage?.(caseItem.id, notes)
                                    setInitialPanelTab('activity')
                                    onSelectCase?.(caseItem.id)
                                  },
                                  variant: 'success',
                                  placeholder: 'Notes about this stage?',
                                },
                                {
                                  label: 'Decline',
                                  onClick: (notes) => {
                                    if (notes) {
                                      onDecline?.(caseItem.id, notes)
                                      setInitialPanelTab('activity')
                                      onSelectCase?.(caseItem.id)
                                    }
                                  },
                                  variant: 'danger',
                                  placeholder: 'Reason for decline?',
                                },
                                {
                                  label: 'Withdraw',
                                  onClick: (notes) => {
                                    if (notes) {
                                      onWithdraw?.(caseItem.id, notes)
                                      setInitialPanelTab('activity')
                                      onSelectCase?.(caseItem.id)
                                    }
                                  },
                                  variant: 'danger',
                                  placeholder: 'Reason for withdrawal?',
                                },
                              ]}
                            />
                          )}
                        </InlineActions>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredCases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <p className="text-sm">No cases</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side Panel */}
      <CaseSidePanel
        caseItem={selectedCase}
        client={selectedCase ? getClient(selectedCase.clientId) : undefined}
        banks={banks}
        clients={clients}
        isOpen={isPanelOpen}
        isCreateMode={isCreateMode ?? false}
        initialTab={initialPanelTab}
        onClose={() => {
          onCloseSidePanel?.()
          if (isCreateMode) onToggleCreateMode?.()
        }}
        onUpdateCase={(updates) => selectedCaseId && onUpdateCase?.(selectedCaseId, updates)}
        onUploadBankForm={(formType, file) => selectedCaseId && onUploadBankForm?.(selectedCaseId, formType, file)}
        onLogCall={(outcome, notes) => selectedCaseId && onLogCall?.(selectedCaseId, outcome, notes)}
        onAddNote={(content) => selectedCaseId && onAddNote?.(selectedCaseId, content)}
        onAdvanceStage={(notes) => selectedCaseId && onAdvanceStage?.(selectedCaseId, notes)}
        onDecline={(reason) => selectedCaseId && onDecline?.(selectedCaseId, reason)}
        onWithdraw={(reason) => selectedCaseId && onWithdraw?.(selectedCaseId, reason)}
        onCreateCase={onCreateCase}
      />
    </div>
  )
}