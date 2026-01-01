import { useState, useMemo } from 'react'
import { ChevronDown, Square, CheckSquare, Search } from 'lucide-react'
import type { Lead, LeadStatus, Channel, LeadsPageProps } from '@/../product/sections/leads/types'
import { LeadSidePanel } from './LeadSidePanel'
import { TabButton } from '@/components/TabButton'
import { InlineActions, NoteAction, PhoneAction, RowActionsDropdown, type CallOutcome } from '@/components/InlineActions'

type TabStatus = 'new' | 'all'

const channelConfig: Record<Channel, { label: string; dotColor: string }> = {
  Meta: { label: 'Meta', dotColor: 'bg-blue-500' },
  Google: { label: 'Google', dotColor: 'bg-red-500' },
  WhatsApp: { label: 'WhatsApp', dotColor: 'bg-green-500' },
  Email: { label: 'Email', dotColor: 'bg-slate-500' },
  AskRivo: { label: 'AskRivo', dotColor: 'bg-violet-500' },
}

const statusConfig: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  dropped: { label: 'Dropped', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
  converted: { label: 'Converted', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300' },
}

function formatSlaCountdown(createdAt: string): { text: string; urgent: boolean } {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  // Assuming 24h SLA for leads
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

export function LeadsList({
  leads,
  selectedLeadId,
  filters = {},
  onSelectLead,
  onCloseSidePanel,
  onLogCall,
  onAddNote,
  onDropLead,
  onProceedToClient,
  onUpdateLead,
  onFilterChange,
}: LeadsPageProps) {
  const [activeTab, setActiveTab] = useState<TabStatus>('new')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [campaignFilterOpen, setCampaignFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [initialPanelTab, setInitialPanelTab] = useState<'profile' | 'activity'>('profile')

  const selectedLead = useMemo(() =>
    leads.find(l => l.id === selectedLeadId),
    [leads, selectedLeadId]
  )

  // Get unique campaigns from leads (filter out undefined/empty)
  const campaigns = useMemo(() => {
    const unique = new Set(leads.map(l => l.campaign).filter(Boolean))
    return Array.from(unique) as string[]
  }, [leads])

  // Get the most recent activity time for a lead (call log, note, or status change)
  const getLastActivityTime = (lead: Lead): number => {
    const callTimes = lead.callLogs?.map(c => new Date(c.timestamp).getTime()) || []
    const noteTimes = lead.notes?.map(n => new Date(n.timestamp).getTime()) || []
    const statusTimes = lead.statusChanges?.map(s => new Date(s.timestamp).getTime()) || []
    const allTimes = [...callTimes, ...noteTimes, ...statusTimes]
    return allTimes.length > 0 ? Math.max(...allTimes) : 0
  }

  // Get the most recent activity timestamp as ISO string
  const getLastActivityTimestamp = (lead: Lead): string | null => {
    const time = getLastActivityTime(lead)
    return time > 0 ? new Date(time).toISOString() : null
  }

  // Filter leads based on tab, campaign filter, and search
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Tab filter - New shows only new, All shows everything
      if (activeTab === 'new' && lead.status !== 'new') return false
      // Campaign filter
      if (filters.campaign && lead.campaign !== filters.campaign) return false
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase()
        const matchesName = fullName.includes(query)
        const matchesPhone = lead.phone.toLowerCase().includes(query)
        const matchesEmail = lead.email?.toLowerCase().includes(query)
        if (!matchesName && !matchesPhone && !matchesEmail) return false
      }
      return true
    }).sort((a, b) => {
      if (activeTab === 'all') {
        // For All tab: recently converted/dropped at top, then by most recent activity
        const aLastStatusChange = a.statusChanges?.length ? a.statusChanges[a.statusChanges.length - 1].timestamp : null
        const bLastStatusChange = b.statusChanges?.length ? b.statusChanges[b.statusChanges.length - 1].timestamp : null

        // If one has a status change and the other doesn't, status change comes first
        if (aLastStatusChange && !bLastStatusChange) return -1
        if (!aLastStatusChange && bLastStatusChange) return 1

        // If both have status changes, most recent first
        if (aLastStatusChange && bLastStatusChange) {
          return new Date(bLastStatusChange).getTime() - new Date(aLastStatusChange).getTime()
        }

        // Otherwise sort by createdAt (newest first for All tab)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }

      // For New tab: sort by SLA (oldest first = most urgent)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [leads, activeTab, filters.campaign, searchQuery])

  // Count leads by status for tabs
  const newCount = leads.filter(l => l.status === 'new').length
  const allCount = leads.length

  // Selection handlers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)))
    }
  }

  const handleBulkDrop = () => {
    selectedIds.forEach(id => {
      onDropLead?.(id)
    })
    setSelectedIds(new Set())
  }

  const isRowDimmed = (lead: Lead) => lead.status === 'dropped' || lead.status === 'converted'

  return (
    <div className="h-full flex">
      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedLeadId ? 'lg:mr-[50%]' : ''}`}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Leads
            </h1>
          </div>

          {/* Tabs and Filters */}
          <div className="flex items-center justify-between">
            {/* Search + Status Tabs */}
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

              {/* Status Tabs */}
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

            {/* Campaign Filter */}
            <div className="relative">
              <button
                onClick={() => setCampaignFilterOpen(!campaignFilterOpen)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                  ${filters.campaign
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {filters.campaign || 'Campaign'}
                <ChevronDown className={`w-4 h-4 transition-transform ${campaignFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {campaignFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCampaignFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1">
                    <button
                      onClick={() => {
                        onFilterChange?.({ ...filters, campaign: undefined })
                        setCampaignFilterOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      All campaigns
                    </button>
                    {campaigns.map(campaign => (
                      <button
                        key={campaign}
                        onClick={() => {
                          onFilterChange?.({ ...filters, campaign })
                          setCampaignFilterOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          filters.campaign === campaign
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {campaign}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex-shrink-0 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300"
              >
                {selectedIds.size === filteredLeads.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedIds.size} selected
              </button>
            </div>
            <button
              onClick={handleBulkDrop}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Drop
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 align-middle w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {selectedIds.size === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead</th>
                {activeTab === 'all' && (
                  <th className="text-left px-4 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                )}
                <th className="text-left px-4 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Intent</th>
                <th className="text-left px-4 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Activity</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredLeads.map((lead) => {
                const channel = channelConfig[lead.channel]
                const status = statusConfig[lead.status]
                const isSelected = lead.id === selectedLeadId
                const isChecked = selectedIds.has(lead.id)
                const isDimmed = isRowDimmed(lead)
                const sla = formatSlaCountdown(lead.createdAt)
                const lastActivityTimestamp = getLastActivityTimestamp(lead)
                const isActive = lead.status !== 'dropped' && lead.status !== 'converted'

                return (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setInitialPanelTab('profile')
                      onSelectLead?.(lead.id)
                    }}
                    className={`
                      cursor-pointer transition-colors group
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      ${isDimmed ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={(e) => toggleSelect(lead.id, e)}
                        className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Lead: Name + SLA countdown (stacked) */}
                    <td className="px-4 py-3 overflow-hidden align-middle">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">{lead.firstName} {lead.lastName}</div>
                        {!isDimmed && (
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

                    {/* Status Badge - only in All tab */}
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
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{channel.label}</span>
                        {lead.campaign && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono truncate">
                            {lead.campaign}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Intent */}
                    <td className="px-4 py-3 align-middle">
                      <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{lead.intent}</span>
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
                            onAddNote?.(lead.id, content)
                            setInitialPanelTab('activity')
                            onSelectLead?.(lead.id)
                          }}
                        />
                        <PhoneAction
                          phone={lead.phone}
                          onLogCall={(outcome: CallOutcome, notes?: string) => {
                            onLogCall?.(lead.id, outcome, notes)
                            setInitialPanelTab('activity')
                            onSelectLead?.(lead.id)
                          }}
                        />
                        {isActive && (
                          <RowActionsDropdown
                            actions={[
                              {
                                label: 'Convert',
                                onClick: (notes?: string) => {
                                  onProceedToClient?.(lead.id, notes)
                                  setInitialPanelTab('activity')
                                  onSelectLead?.(lead.id)
                                },
                                variant: 'success',
                                placeholder: 'Notes before handover?',
                              },
                              {
                                label: 'Drop',
                                onClick: (notes?: string) => {
                                  onDropLead?.(lead.id, notes)
                                  setInitialPanelTab('activity')
                                  onSelectLead?.(lead.id)
                                },
                                variant: 'danger',
                                placeholder: 'Reason for drop?',
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

          {filteredLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-sm">No leads</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <LeadSidePanel
        lead={selectedLead}
        isOpen={!!selectedLeadId}
        initialTab={initialPanelTab}
        onClose={() => onCloseSidePanel?.()}
        onLogCall={(outcome, notes) => selectedLeadId && onLogCall?.(selectedLeadId, outcome, notes)}
        onDropLead={(notes) => selectedLeadId && onDropLead?.(selectedLeadId, notes)}
        onProceedToClient={(notes) => selectedLeadId && onProceedToClient?.(selectedLeadId, notes)}
        onUpdateLead={(updates) => selectedLeadId && onUpdateLead?.(selectedLeadId, updates)}
        onAddNote={(content) => selectedLeadId && onAddNote?.(selectedLeadId, content)}
      />
    </div>
  )
}