import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import type { ClientsPageProps, Channel } from '@/../product/sections/clients/types'
import { ClientSidePanel } from './ClientSidePanel'
import { TabButton } from '@/components/TabButton'
import { InlineActions, NoteAction, PhoneAction, RowActionsDropdown, type CallOutcome } from '@/components/InlineActions'

type TabFilter = 'new' | 'all'

const channelConfig: Record<Channel, { label: string; dotColor: string }> = {
  Meta: { label: 'Meta', dotColor: 'bg-blue-500' },
  Google: { label: 'Google', dotColor: 'bg-red-500' },
  WhatsApp: { label: 'WhatsApp', dotColor: 'bg-green-500' },
  Email: { label: 'Email', dotColor: 'bg-slate-500' },
  AskRivo: { label: 'AskRivo', dotColor: 'bg-violet-500' },
  PartnerDSA: { label: 'Partner DSA', dotColor: 'bg-amber-500' },
  RMA: { label: 'RMA', dotColor: 'bg-cyan-500' },
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'New', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  converted: { label: 'Converted', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
  notEligible: { label: 'Not Eligible', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
  notProceeding: { label: 'Not Proceeding', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
}

function formatSlaCountdown(createdAt: string): { text: string; urgent: boolean } {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  // Assuming 24h SLA for clients
  const slaHours = 24
  const remainingHours = slaHours - diffHours

  if (remainingHours <= 0) {
    return { text: 'Overdue', urgent: true }
  } else if (remainingHours <= 2) {
    return { text: `${remainingHours}h left`, urgent: true }
  } else {
    return { text: `${remainingHours}h left`, urgent: false }
  }
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

export function ClientsList({
  clients,
  selectedClientId,
  onSelectClient,
  onCloseSidePanel,
  onUpdateClient,
  onUploadDocument,
  onRequestDocuments,
  onLogCall,
  onAddNote,
  onSendMessage,
  onCreateCase,
  onMarkNotProceeding,
  onMarkNotEligible,
  onCreateClient,
  isCreateMode,
  onToggleCreateMode,
}: ClientsPageProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('new')
  const [searchQuery, setSearchQuery] = useState('')
  const [initialPanelTab, setInitialPanelTab] = useState<'profile' | 'activity'>('profile')

  const selectedClient = useMemo(() =>
    clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  )

  // Get the most recent activity time for a client (call log, note, or status change)
  const getLastActivityTime = (client: typeof clients[0]): number => {
    const callTimes = client.callLogs?.map(c => new Date(c.timestamp).getTime()) || []
    const noteTimes = client.notes?.map(n => new Date(n.timestamp).getTime()) || []
    const statusTimes = client.statusChanges?.map(s => new Date(s.timestamp).getTime()) || []
    const allTimes = [...callTimes, ...noteTimes, ...statusTimes]
    return allTimes.length > 0 ? Math.max(...allTimes) : 0
  }

  // Get the most recent activity timestamp as ISO string
  const getLastActivityTimestamp = (client: typeof clients[0]): string | null => {
    const time = getLastActivityTime(client)
    return time > 0 ? new Date(time).toISOString() : null
  }

  // Filter clients based on tab and search
  const filteredClients = useMemo(() => {
    let filtered = clients

    if (activeTab === 'new') {
      // New = active status (not converted, not notProceeding, not notEligible)
      filtered = filtered.filter(c => !c.status || c.status === 'active')
    }
    // 'all' tab shows everything

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
        const matchesName = fullName.includes(query)
        const matchesPhone = c.phone?.toLowerCase().includes(query)
        const matchesEmail = c.email?.toLowerCase().includes(query)
        return matchesName || matchesPhone || matchesEmail
      })
    }

    // Sort based on tab
    if (activeTab === 'new') {
      // New tab: sort by SLA (oldest first = most urgent)
      return filtered.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    } else {
      // All tab: sort by most recent activity (newest first)
      return filtered.sort((a, b) => {
        const aActivity = getLastActivityTime(a)
        const bActivity = getLastActivityTime(b)
        if (aActivity !== bActivity) {
          return bActivity - aActivity
        }
        // Fallback to created time (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
  }, [clients, activeTab, searchQuery])

  // Count by status for tabs
  const newCount = clients.filter(c => !c.status || c.status === 'active').length
  const allCount = clients.length

  const isPanelOpen = !!selectedClientId || !!isCreateMode

  return (
    <div className="h-full flex">
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isPanelOpen ? 'lg:mr-[50%]' : ''}`}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Clients
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
              active={activeTab === 'new'}
              onClick={() => setActiveTab('new')}
              count={newCount}
            >
              New
            </TabButton>
            <TabButton
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              count={allCount}
            >
              All
            </TabButton>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                {activeTab === 'all' && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Eligibility
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredClients.map((client) => {
                // Show status: active (new), converted, notProceeding, or notEligible
                const displayStatus = client.status || 'active'
                const status = statusConfig[displayStatus] || statusConfig.active
                const isSelected = client.id === selectedClientId
                const isDimmed = client.status === 'converted' || client.status === 'notProceeding' || client.status === 'notEligible'
                const isActive = !client.status || client.status === 'active'
                const lastActivityTimestamp = getLastActivityTimestamp(client)
                const sla = formatSlaCountdown(client.createdAt)

                return (
                  <tr
                    key={client.id}
                    onClick={() => {
                      setInitialPanelTab('profile')
                      onSelectClient?.(client.id)
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
                    {/* Client Name + SLA (New tab) or just Name (All tab) */}
                    <td className="px-6 py-3 overflow-hidden align-middle">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {client.firstName} {client.lastName}
                        </div>
                        {activeTab === 'new' && !isDimmed && (
                          <div className={`text-xs ${
                            sla.urgent
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {sla.text}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status - only in All tab */}
                    {activeTab === 'all' && (
                      <td className="px-4 py-3 align-middle">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                    )}

                    {/* Source: Channel + Campaign (stacked) */}
                    <td className="px-4 py-3 overflow-hidden align-middle">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {channelConfig[client.source.channel]?.label || client.source.channel}
                        </span>
                        {client.source.campaign && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono truncate">
                            {client.source.campaign}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Eligibility */}
                    <td className="px-4 py-3 align-middle">
                      {client.eligibilityStatus === 'pending' ? (
                        <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                      ) : (
                        <div className="flex flex-col gap-1.5 w-[120px]">
                          {/* DBR Bar */}
                          {client.estimatedDBR !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400 w-7">DBR</span>
                              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                                client.estimatedDBR <= 50 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                              }`}>
                                <div
                                  className={`h-full rounded-full ${client.estimatedDBR <= 50 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                                  style={{ width: `${Math.min(client.estimatedDBR, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium w-8 text-right ${
                                client.estimatedDBR <= 50 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                {client.estimatedDBR}%
                              </span>
                            </div>
                          )}
                          {/* LTV Bar */}
                          {client.estimatedLTV !== null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400 w-7">LTV</span>
                              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                                client.estimatedLTV <= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                              }`}>
                                <div
                                  className={`h-full rounded-full ${client.estimatedLTV <= 80 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                                  style={{ width: `${Math.min(client.estimatedLTV, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium w-8 text-right ${
                                client.estimatedLTV <= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                {client.estimatedLTV}%
                              </span>
                            </div>
                          )}
                          {/* Bank count with tooltip */}
                          {client.eligibleBanks && client.eligibleBanks.length > 0 && (
                            <div className="relative group">
                              <span className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                                {client.eligibleBanks.length}+ banks
                              </span>
                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap shadow-lg">
                                  {client.eligibleBanks.join(', ')}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                            onAddNote?.(client.id, content)
                            setInitialPanelTab('activity')
                            onSelectClient?.(client.id)
                          }}
                        />
                        <PhoneAction
                          phone={client.phone}
                          onLogCall={(outcome: CallOutcome, notes?: string) => {
                            onLogCall?.(client.id, outcome, notes)
                            setInitialPanelTab('activity')
                            onSelectClient?.(client.id)
                          }}
                        />
                        {isActive && (
                          <RowActionsDropdown
                            actions={[
                              {
                                label: 'Convert',
                                onClick: (notes) => {
                                  onCreateCase?.(client.id, notes)
                                  setInitialPanelTab('activity')
                                  onSelectClient?.(client.id)
                                },
                                variant: 'success',
                                placeholder: 'Notes before handover?',
                              },
                              {
                                label: 'Not Eligible',
                                onClick: (notes) => {
                                  onMarkNotEligible?.(client.id, notes)
                                  setInitialPanelTab('activity')
                                  onSelectClient?.(client.id)
                                },
                                variant: 'danger',
                                placeholder: 'Reason for not eligible?',
                              },
                              {
                                label: 'Not Proceeding',
                                onClick: (notes) => {
                                  onMarkNotProceeding?.(client.id, notes)
                                  setInitialPanelTab('activity')
                                  onSelectClient?.(client.id)
                                },
                                variant: 'danger',
                                placeholder: 'Reason for not proceeding?',
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
          {filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-sm">No clients</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <ClientSidePanel
        client={selectedClient}
        isOpen={isPanelOpen}
        isCreateMode={isCreateMode ?? false}
        initialTab={initialPanelTab}
        onClose={() => {
          onCloseSidePanel?.()
          if (isCreateMode) onToggleCreateMode?.()
        }}
        onUpdateClient={(updates) => selectedClientId && onUpdateClient?.(selectedClientId, updates)}
        onUploadDocument={(docType, file) => selectedClientId && onUploadDocument?.(selectedClientId, docType, file)}
        onRequestDocuments={(docTypes) => selectedClientId && onRequestDocuments?.(selectedClientId, docTypes)}
        onLogCall={(outcome, notes) => selectedClientId && onLogCall?.(selectedClientId, outcome, notes)}
        onAddNote={(content) => selectedClientId && onAddNote?.(selectedClientId, content)}
        onSendMessage={(content) => selectedClientId && onSendMessage?.(selectedClientId, content)}
        onCreateCase={(notes) => selectedClientId && onCreateCase?.(selectedClientId, notes)}
        onMarkNotProceeding={(notes) => selectedClientId && onMarkNotProceeding?.(selectedClientId, notes)}
        onMarkNotEligible={(notes) => selectedClientId && onMarkNotEligible?.(selectedClientId, notes)}
        onCreateClient={onCreateClient}
      />
    </div>
  )
}