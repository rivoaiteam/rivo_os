/**
 * Clients Page
 */

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ClientListItem, ClientStatus, CallOutcome, DocumentType, Client } from '@/types/clients'
import type { CallOutcome as CaseCallOutcome, BankFormType, Case } from '@/types/cases'
import { useClients, useClient, useLogClientCall, useAddClientNote, useMarkNotProceeding, useMarkNotEligible, useUploadDocument, useDeleteDocument, useCreateClient, useUpdateClient, useCreateCase } from '@/hooks/useClients'
import { useCase, useLogCaseCall, useAddCaseNote, useAdvanceStage, useDeclineCase, useWithdrawCase, useUploadBankForm, useDeleteBankForm, useUpdateCase } from '@/hooks/useCases'
import { useBankProducts } from '@/hooks/useSettings'
import { usePagination } from '@/hooks/usePagination'
import { ClientSidePanel } from '@/components/clients'
import { CaseSidePanel } from '@/components/cases'
import { TabButton, NoteAction, PhoneAction, RowActionsDropdown, CasesDropdown, EmptyState, SlaTimer, Pagination } from '@/components/ui'

type TabType = 'active' | 'all'

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [initialPanelTab, setInitialPanelTab] = useState<'profile' | 'documents' | 'activity'>('profile')
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)

  // Pagination
  const { page, pageSize, setPage, setPageSize, resetPage, getPaginationInfo } = usePagination()

  // Handle URL parameter for opening client from converted lead link
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      const clientId = parseInt(idParam, 10)
      if (!isNaN(clientId)) {
        setSelectedClientId(clientId)
        setInitialPanelTab('profile')
        // Clear the URL parameter
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, setSearchParams])

  // Build filters with pagination and status
  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    status: activeTab === 'active' ? 'active' as const : undefined,
    page,
    pageSize,
  }), [searchQuery, activeTab, page, pageSize])

  const { data: paginatedClients } = useClients(filters)

  // Extract clients and pagination info from response
  const clients = paginatedClients?.results || []
  const pagination = getPaginationInfo(paginatedClients)

  // Reset to page 1 when filters change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    resetPage()
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    resetPage()
  }

  // Fetch full detail only when a client is selected
  const { data: selectedClient } = useClient(selectedClientId)

  const logCall = useLogClientCall()
  const addNote = useAddClientNote()
  const markNotProceeding = useMarkNotProceeding()
  const markNotEligible = useMarkNotEligible()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const createCase = useCreateCase()

  // Case-related data and mutations for the case side panel overlay
  const { data: selectedCase } = useCase(selectedCaseId)
  const { data: bankProductsData } = useBankProducts()
  const bankProducts = bankProductsData?.results ?? []
  const logCaseCall = useLogCaseCall()
  const addCaseNote = useAddCaseNote()
  const advanceStage = useAdvanceStage()
  const declineCase = useDeclineCase()
  const withdrawCase = useWithdrawCase()
  const uploadBankForm = useUploadBankForm()
  const deleteBankForm = useDeleteBankForm()
  const updateCase = useUpdateCase()

  // Create unique banks list for case panel
  const banks = useMemo(() => {
    const uniqueBanks = new Map<string, { name: string; icon?: string }>()
    bankProducts.forEach(product => {
      if (product.bankName && !uniqueBanks.has(product.bankName)) {
        uniqueBanks.set(product.bankName, {
          name: product.bankName,
          icon: product.bankIcon || undefined,
        })
      }
    })
    return Array.from(uniqueBanks.values())
  }, [bankProducts])

  // Sort clients - newest first (server already sorts, but just in case)
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
  }, [clients])

  const handleRowClick = (client: ClientListItem) => {
    setInitialPanelTab('profile')
    setSelectedClientId(client.id)
    setShowCreatePanel(false)
  }

  const handleAddNote = (clientId: number) => (content: string) => {
    addNote.mutate({ entityId: clientId, content })
    setInitialPanelTab('activity')
    setSelectedClientId(clientId)
  }

  const handleLogCall = (clientId: number) => (outcome: CallOutcome, notes?: string) => {
    logCall.mutate({ entityId: clientId, outcome, notes })
    setInitialPanelTab('activity')
    setSelectedClientId(clientId)
  }

  const handleMarkNotProceeding = (clientId: number, notes?: string) => {
    markNotProceeding.mutate({ entityId: clientId, status: 'notProceeding', notes })
    setInitialPanelTab('activity')
    setSelectedClientId(clientId)
  }

  const handleMarkNotEligible = (clientId: number, notes?: string) => {
    markNotEligible.mutate({ entityId: clientId, status: 'notEligible', notes })
    setInitialPanelTab('activity')
    setSelectedClientId(clientId)
  }

  const handleCreateCase = (clientId: number) => {
    createCase.mutate({ id: clientId }, {
      onSuccess: () => {
        setInitialPanelTab('activity')
        setSelectedClientId(clientId)
      }
    })
  }

  const handleUploadDocument = (clientId: number, type: DocumentType, file: File) => {
    uploadDocument.mutate({ id: clientId, type, file })
  }

  const handleUpdateClient = (clientId: number, data: Partial<Client>) => {
    updateClient.mutate({ id: clientId, data })
  }

  // Case panel handlers (for viewing case from client)
  const handleCaseAddNote = (caseId: number) => (content: string) => {
    addCaseNote.mutate({ entityId: caseId, content })
  }

  const handleCaseLogCall = (caseId: number) => (outcome: CaseCallOutcome, notes?: string) => {
    logCaseCall.mutate({ entityId: caseId, outcome, notes })
  }

  const handleCaseAdvanceStage = (caseId: number, notes?: string) => {
    advanceStage.mutate({ id: caseId, notes })
  }

  const handleCaseDecline = (caseId: number, reason?: string) => {
    declineCase.mutate({ entityId: caseId, status: 'declined', reason })
    setSelectedCaseId(null)
  }

  const handleCaseWithdraw = (caseId: number, reason?: string) => {
    withdrawCase.mutate({ entityId: caseId, status: 'withdrawn', reason })
    setSelectedCaseId(null)
  }

  const handleCaseUploadBankForm = (caseId: number, type: BankFormType, file: File) => {
    uploadBankForm.mutate({ id: caseId, type, file })
  }

  const handleCaseUpdate = (caseId: number, data: Partial<Case>) => {
    updateCase.mutate({ id: caseId, data })
    setSelectedCaseId(null)
  }

  const getStatusBadge = (status: ClientStatus) => {
    const config: Record<ClientStatus, { label: string; color: string }> = {
      active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
      notProceeding: { label: 'Withdrawn', color: 'bg-slate-200 text-slate-500' },
      notEligible: { label: 'Not Eligible', color: 'bg-red-100 text-red-700' },
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${config[status].color}`}>
        {config[status].label}
      </span>
    )
  }

  const formatPercent = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '—'
    return `${num}%`
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
              <p className="text-sm text-slate-500 mt-1">
                Track client eligibility and documents
              </p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Client
            </button>
          </div>

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

              {/* Tabs */}
              <div className="flex items-center">
                <TabButton
                  active={activeTab === 'active'}
                  onClick={() => handleTabChange('active')}
                  count={activeTab === 'active' && pagination ? pagination.count : undefined}
                >
                  Active
                </TabButton>
                <TabButton
                  active={activeTab === 'all'}
                  onClick={() => handleTabChange('all')}
                  count={activeTab === 'all' && pagination ? pagination.count : undefined}
                >
                  All
                </TabButton>
              </div>
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr className="border-b border-slate-200">
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                {activeTab === 'all' && (
                  <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  DBR / LTV
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Max Loan
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="w-24 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => handleRowClick(client)}
                  className="hover:bg-slate-50 cursor-pointer group"
                >
                  <td className="px-3 py-3 align-middle">
                    <div className="text-sm text-slate-900 truncate">
                      {client.firstName} {client.lastName}
                    </div>
                    {client.sourceSlaMin && !client.hasActivity && (
                      <div className="text-xs">
                        <SlaTimer createdAt={client.createdAt} slaMinutes={client.sourceSlaMin} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="text-sm text-slate-600 truncate block">
                      {client.sourceDisplay || '—'}
                    </span>
                  </td>
                  {activeTab === 'all' && (
                    <td className="px-3 py-3 align-middle">
                      {getStatusBadge(client.status)}
                    </td>
                  )}
                  <td className="px-3 py-3 align-middle">
                    <span className="text-sm text-slate-600">
                      {formatPercent(client.estimatedDbr)} / {formatPercent(client.estimatedLtv)}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="text-sm text-slate-600">
                      {client.maxLoanAmount ? `AED ${client.maxLoanAmount.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <span className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(client.updatedAt || client.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-2 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      {/* Show dropdown for clients with cases */}
                      {client.caseId && client.caseId.length > 0 && (
                        <CasesDropdown
                          cases={client.caseId}
                          onSelectCase={(caseId) => setSelectedCaseId(caseId)}
                        />
                      )}
                      {/* Show actions for active clients without cases */}
                      {client.status === 'active' && (
                        <>
                          <NoteAction onAddNote={handleAddNote(client.id)} />
                          <PhoneAction phone={client.phone} onLogCall={handleLogCall(client.id)} />
                          {/* Hide three dots if client already has cases */}
                          {(!client.caseId || client.caseId.length === 0) && (
                            <RowActionsDropdown
                              actions={[
                                {
                                  label: 'Convert',
                                  onClick: () => handleCreateCase(client.id),
                                  variant: 'success',
                                  placeholder: 'Notes before handover?',
                                },
                                {
                                  label: 'Withdrawn',
                                  onClick: (notes?: string) => handleMarkNotProceeding(client.id, notes),
                                  variant: 'warning' as const,
                                  placeholder: 'Reason for withdrawal?',
                                },
                                {
                                  label: 'Not Eligible',
                                  onClick: (notes?: string) => handleMarkNotEligible(client.id, notes),
                                  variant: 'danger' as const,
                                  placeholder: 'Reason for not eligible?',
                                },
                              ]}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedClients.length === 0 && (
            <EmptyState message="No clients found" />
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Side Panel - View Mode */}
      {selectedClientId && selectedClient && (
        <ClientSidePanel
          mode="view"
          client={selectedClient}
          onClose={() => setSelectedClientId(null)}
          onAddNote={handleAddNote(selectedClient.id)}
          onLogCall={handleLogCall(selectedClient.id)}
          onMarkNotProceeding={(notes) => handleMarkNotProceeding(selectedClient.id, notes)}
          onMarkNotEligible={(notes) => handleMarkNotEligible(selectedClient.id, notes)}
          onCreateCase={() => handleCreateCase(selectedClient.id)}
          onUploadDocument={(type, file) => handleUploadDocument(selectedClient.id, type, file)}
          onDeleteDocument={(documentId) => deleteDocument.mutate({ clientId: selectedClient.id, documentId })}
          onUpdate={(data) => handleUpdateClient(selectedClient.id, data)}
          initialTab={initialPanelTab}
          cases={selectedClient.cases}
          onGoToCase={(caseId) => setSelectedCaseId(caseId)}
        />
      )}

      {/* Side Panel - Create Mode */}
      <ClientSidePanel
        mode="create"
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onCreate={(data) => {
          setShowCreatePanel(false)  // Close immediately
          createClient.mutate(data)   // API call in background
        }}
      />

      {/* Case Side Panel - View Mode (overlays on top of client panels) */}
      {selectedCaseId && selectedCase && (
        <CaseSidePanel
          mode="view"
          caseData={selectedCase}
          onClose={() => setSelectedCaseId(null)}
          onAddNote={handleCaseAddNote(selectedCase.id)}
          onLogCall={handleCaseLogCall(selectedCase.id)}
          onAdvanceStage={(notes) => handleCaseAdvanceStage(selectedCase.id, notes)}
          onDecline={(reason) => handleCaseDecline(selectedCase.id, reason)}
          onWithdraw={(reason) => handleCaseWithdraw(selectedCase.id, reason)}
          onUploadBankForm={(type, file) => handleCaseUploadBankForm(selectedCase.id, type, file)}
          onDeleteBankForm={(formId) => deleteBankForm.mutate({ caseId: selectedCase.id, formId })}
          onUpdate={(data) => handleCaseUpdate(selectedCase.id, data)}
          initialTab="case"
          banks={banks}
          viewOnly
        />
      )}
    </div>
  )
}
