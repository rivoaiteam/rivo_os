/**
 * Leads Page
 */

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useLeads, useLogCall, useAddNote, useDropLead, useConvertLead, useUpdateLead } from '@/hooks/useLeads'
import { useClient, useLogClientCall, useAddClientNote, useMarkNotProceeding, useMarkNotEligible, useUploadDocument, useDeleteDocument } from '@/hooks/useClients'
import { useSources, useSubSources } from '@/hooks/useSettings'
import type { Lead, LeadStatus, CallOutcome } from '@/types/leads'
import type { CallOutcome as ClientCallOutcome, DocumentType } from '@/types/clients'
import { TabButton } from '@/components/ui/TabButton'
import { FilterButton } from '@/components/ui/FilterButton'
import { Pagination } from '@/components/ui/Pagination'
import { SlaTimer } from '@/components/ui/SlaTimer'
import { NoteAction, PhoneAction, RowActionsDropdown, ClientLink } from '@/components/ui/InlineActions'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeadSidePanel } from '@/components/leads/LeadSidePanel'
import { ClientSidePanel } from '@/components/clients/ClientSidePanel'

type TabStatus = 'new' | 'all'

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-emerald-100 text-emerald-700' },
  dropped: { label: 'Not Eligible', color: 'bg-red-100 text-red-700' },
  converted: { label: 'Converted', color: 'bg-blue-100 text-blue-700' },
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

export function LeadsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('new')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | undefined>()
  const [sourceFilterOpen, setSourceFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Lead panel state
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [initialPanelTab, setInitialPanelTab] = useState<'profile' | 'activity'>('profile')

  // Client overlay state
  const [clientOverlayId, setClientOverlayId] = useState<number | null>(null)

  // Build filters with pagination
  const filters = useMemo(() => ({
    source: sourceFilter,
    search: searchQuery || undefined,
    status: activeTab === 'new' ? 'new' as const : undefined,
    page,
    pageSize,
  }), [sourceFilter, searchQuery, activeTab, page, pageSize])

  const { data: paginatedLeads, error } = useLeads(filters)

  // Extract leads and pagination info from response
  const leads = useMemo(() => paginatedLeads?.results || [], [paginatedLeads?.results])
  const pagination = paginatedLeads ? {
    count: paginatedLeads.count,
    totalPages: paginatedLeads.totalPages,
    currentPage: paginatedLeads.currentPage,
    pageSize: paginatedLeads.pageSize,
  } : null

  // Reset to page 1 when filters change
  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleSourceFilterChange = (source: string | undefined) => {
    setSourceFilter(source)
    setPage(1)
  }
  const logCallMutation = useLogCall()
  const addNoteMutation = useAddNote()
  const dropLeadMutation = useDropLead()
  const convertLeadMutation = useConvertLead()
  const updateLeadMutation = useUpdateLead()

  // Client overlay hooks
  const { data: overlayClient } = useClient(clientOverlayId)
  const clientLogCallMutation = useLogClientCall()
  const clientAddNoteMutation = useAddClientNote()
  const markNotProceedingMutation = useMarkNotProceeding()
  const markNotEligibleMutation = useMarkNotEligible()
  const uploadDocumentMutation = useUploadDocument()
  const deleteDocumentMutation = useDeleteDocument()

  // Fetch sources from untrusted channel (perf_marketing)
  const { data: sources } = useSources('perf_marketing')
  const { data: allSubSources } = useSubSources()

  // Filter SubSources for untrusted channel (perf_marketing)
  const untrustedSubSources = useMemo(() => {
    if (!allSubSources || !sources) return []
    const sourceIds = new Set(sources.map(s => s.id))
    return allSubSources.filter(ss => sourceIds.has(ss.sourceId))
  }, [allSubSources, sources])

  // Find selected lead from current page
  const selectedLead = useMemo(() =>
    leads.find(l => l.id === selectedLeadId),
    [leads, selectedLeadId]
  )

  // Get the most recent activity time for a lead
  const getLastActivityTime = (lead: Lead): number => {
    const callTimes = lead.callLogs?.map(c => new Date(c.timestamp).getTime()) || []
    const noteTimes = lead.notes?.map(n => new Date(n.timestamp).getTime()) || []
    const statusTimes = lead.statusChanges?.map(s => new Date(s.timestamp).getTime()) || []
    const allTimes = [...callTimes, ...noteTimes, ...statusTimes]
    return allTimes.length > 0 ? Math.max(...allTimes) : 0
  }

  const getLastActivityTimestamp = (lead: Lead): string | null => {
    const time = getLastActivityTime(lead)
    return time > 0 ? new Date(time).toISOString() : null
  }

  // Sort leads (server already sorts, but we can adjust for "new" tab)
  const sortedLeads = useMemo(() => {
    if (activeTab === 'new') {
      // Oldest first (most urgent)
      return [...leads].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }
    return leads // Server already returns newest first
  }, [leads, activeTab])

  // Action handlers - switch to activity tab after actions
  const handleLogCall = (leadId: number, outcome: CallOutcome, notes?: string) => {
    logCallMutation.mutate({ entityId: leadId, outcome, notes })
    setInitialPanelTab('activity')
    setSelectedLeadId(leadId)
  }

  const handleAddNote = (leadId: number, content: string) => {
    addNoteMutation.mutate({ entityId: leadId, content })
    setInitialPanelTab('activity')
    setSelectedLeadId(leadId)
  }

  const handleDropLead = (leadId: number, notes?: string) => {
    dropLeadMutation.mutate({ entityId: leadId, status: 'dropped', notes })
    setInitialPanelTab('activity')
    setSelectedLeadId(leadId)
  }

  const handleConvertLead = (leadId: number, notes?: string) => {
    convertLeadMutation.mutate({ id: leadId, notes })
    setInitialPanelTab('activity')
    setSelectedLeadId(leadId)
  }

  const handleUpdateLead = (leadId: number, updates: Partial<Lead>) => {
    updateLeadMutation.mutate({ id: leadId, data: updates })
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading leads. Please try again.</div>
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and convert incoming leads
            </p>
          </div>

          {/* Tabs and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center">
                <TabButton active={activeTab === 'new'} onClick={() => handleTabChange('new')} count={activeTab === 'new' && pagination ? pagination.count : undefined}>
                  New
                </TabButton>
                <TabButton active={activeTab === 'all'} onClick={() => handleTabChange('all')} count={activeTab === 'all' && pagination ? pagination.count : undefined}>
                  All
                </TabButton>
              </div>
            </div>

            {/* Source Filter */}
            <div className="relative">
              <FilterButton
                label="Source"
                value={untrustedSubSources.find(s => s.id === sourceFilter)?.name}
                isOpen={sourceFilterOpen}
                onClick={() => setSourceFilterOpen(!sourceFilterOpen)}
              />

              {sourceFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSourceFilterOpen(false)} />
                  <div className="absolute right-0 mt-1 w-64 max-h-64 overflow-y-auto bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                    <button
                      onClick={() => {
                        handleSourceFilterChange(undefined)
                        setSourceFilterOpen(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      All
                    </button>
                    {untrustedSubSources.map(subSource => (
                      <button
                        key={subSource.id}
                        onClick={() => {
                          handleSourceFilterChange(subSource.id)
                          setSourceFilterOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          sourceFilter === subSource.id
                            ? 'text-blue-600'
                            : 'text-slate-600'
                        }`}
                      >
                        <span className="block truncate">{subSource.name}</span>
                        {subSource.sourceName && (
                          <span className="block text-xs text-slate-400 truncate">{subSource.sourceName}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                {activeTab === 'all' && (
                  <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                )}
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">Intent</th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</th>
                <th className="w-24 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedLeads.map((lead) => {
                const status = statusConfig[lead.status]
                const isSelected = lead.id === selectedLeadId
                const lastActivityTimestamp = getLastActivityTimestamp(lead)
                const isActive = lead.status === 'new'
                const showSla = isActive && !lead.hasActivity && lead.sourceSlaMin

                return (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      setInitialPanelTab('profile')
                      setSelectedLeadId(lead.id)
                    }}
                    className={`cursor-pointer transition-colors group ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Lead Name + SLA */}
                    <td className="px-3 py-3 overflow-hidden align-middle">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm text-slate-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </div>
                        {showSla && (
                          <div className="text-xs">
                            <SlaTimer createdAt={lead.createdAt} slaMinutes={lead.sourceSlaMin!} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-3 py-3 overflow-hidden align-middle">
                      <span className="text-sm text-slate-700 truncate">
                        {lead.sourceDisplay || '-'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    {activeTab === 'all' && (
                      <td className="px-3 py-3 align-middle">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    )}

                    {/* Intent */}
                    <td className="px-3 py-3 align-middle">
                      <span className="text-sm text-slate-600 line-clamp-2">{lead.intent}</span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-3 py-3 align-middle">
                      <span className="text-sm text-slate-600">
                        {lastActivityTimestamp ? formatRelativeTime(lastActivityTimestamp) : '-'}
                      </span>
                    </td>

                    {/* Inline Actions */}
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-1">
                        {/* Converted leads: show ClientLink + Note + Phone */}
                        {lead.status === 'converted' && lead.convertedClientId && (
                          <ClientLink
                            clientId={lead.convertedClientId}
                            onClick={() => setClientOverlayId(lead.convertedClientId!)}
                          />
                        )}
                        {lead.status === 'converted' && (
                          <>
                            <NoteAction onAddNote={(content) => handleAddNote(lead.id, content)} />
                            <PhoneAction
                              phone={lead.phone}
                              onLogCall={(outcome, notes) => handleLogCall(lead.id, outcome, notes)}
                            />
                          </>
                        )}
                        {/* Active/new leads: show Note + Phone + RowActions */}
                        {isActive && (
                          <>
                            <NoteAction onAddNote={(content) => handleAddNote(lead.id, content)} />
                            <PhoneAction
                              phone={lead.phone}
                              onLogCall={(outcome, notes) => handleLogCall(lead.id, outcome, notes)}
                            />
                            <RowActionsDropdown
                              actions={[
                                {
                                  label: 'Convert',
                                  onClick: (notes) => handleConvertLead(lead.id, notes),
                                  variant: 'success',
                                  placeholder: 'Notes before handover?',
                                },
                                {
                                  label: 'Not Eligible',
                                  onClick: (notes) => handleDropLead(lead.id, notes),
                                  variant: 'danger',
                                  placeholder: 'Reason for not eligible?',
                                },
                              ]}
                            />
                          </>
                        )}
                        {/* Dropped leads: no icons */}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {sortedLeads.length === 0 && (
            <EmptyState message="No leads found" />
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.count > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </div>

      {/* Lead Side Panel */}
      <LeadSidePanel
        lead={selectedLead}
        isOpen={selectedLeadId !== null}
        initialTab={initialPanelTab}
        onClose={() => setSelectedLeadId(null)}
        onLogCall={(outcome, notes) => selectedLeadId && handleLogCall(selectedLeadId, outcome, notes)}
        onAddNote={(content) => selectedLeadId && handleAddNote(selectedLeadId, content)}
        onDropLead={(notes) => selectedLeadId && handleDropLead(selectedLeadId, notes)}
        onConvertLead={(notes) => selectedLeadId && handleConvertLead(selectedLeadId, notes)}
        onUpdateLead={(updates) => selectedLeadId && handleUpdateLead(selectedLeadId, updates)}
        onGoToClient={(clientId) => setClientOverlayId(clientId)}
      />

      {/* Client Overlay Panel (for viewing converted lead's client) */}
      {overlayClient && (
        <ClientSidePanel
          mode="view"
          isOpen={!!clientOverlayId}
          client={overlayClient}
          viewOnly
          onClose={() => setClientOverlayId(null)}
          onAddNote={(content) => clientOverlayId && clientAddNoteMutation.mutate({ entityId: clientOverlayId, content })}
          onLogCall={(outcome: ClientCallOutcome, notes) => clientOverlayId && clientLogCallMutation.mutate({ entityId: clientOverlayId, outcome, notes })}
          onMarkNotProceeding={(notes) => clientOverlayId && markNotProceedingMutation.mutate({ entityId: clientOverlayId, status: 'notProceeding', notes })}
          onMarkNotEligible={(notes) => clientOverlayId && markNotEligibleMutation.mutate({ entityId: clientOverlayId, status: 'notEligible', notes })}
          onCreateCase={() => {}}
          onUploadDocument={(type: DocumentType, file: File) => clientOverlayId && uploadDocumentMutation.mutate({ id: clientOverlayId, type, file })}
          onDeleteDocument={(documentId: number) => clientOverlayId && deleteDocumentMutation.mutate({ clientId: clientOverlayId, documentId })}
        />
      )}
    </div>
  )
}
