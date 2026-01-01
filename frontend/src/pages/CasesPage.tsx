/**
 * Cases Page with List and Kanban views
 */

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, List, LayoutGrid, Plus, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { CaseListItem, CaseStage, CallOutcome, BankFormType, CreateCaseData } from '@/types/cases'
import { STAGE_LABELS, ACTIVE_STAGES, TERMINAL_STAGES } from '@/types/cases'

// Helper to get next stage label for a given current stage
const getNextStageLabel = (currentStage: CaseStage): string | null => {
  const currentIndex = ACTIVE_STAGES.indexOf(currentStage)
  if (currentIndex === -1) return null
  if (currentIndex === ACTIVE_STAGES.length - 1) return 'Disbursed'
  return STAGE_LABELS[ACTIVE_STAGES[currentIndex + 1]]
}

import { useCases, useCase, useLogCaseCall, useAddCaseNote, useAdvanceStage, useDeclineCase, useWithdrawCase, useUploadBankForm, useDeleteBankForm, useCreateCase, useUpdateCase, useSetStage } from '@/hooks/useCases'
import { useClients, useClient, useAddClientNote, useLogClientCall, useUploadDocument, useDeleteDocument } from '@/hooks/useClients'
import { useBankProducts } from '@/hooks/useSettings'
import { CaseSidePanel } from '@/components/cases'
import { ClientSidePanel } from '@/components/clients'
import { TabButton, NoteAction, PhoneAction, RowActionsDropdown, EmptyState } from '@/components/ui'

type ViewType = 'list' | 'kanban'
type TabType = 'active' | 'all'

export default function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewType, setViewType] = useState<ViewType>('list')
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [initialPanelTab, setInitialPanelTab] = useState<'case' | 'documents' | 'activity'>('case')
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  // Handle caseId query param - open side panel for specific case
  useEffect(() => {
    const caseIdParam = searchParams.get('caseId')
    if (caseIdParam) {
      const caseId = parseInt(caseIdParam, 10)
      if (!isNaN(caseId)) {
        setSelectedCaseId(caseId)
        setInitialPanelTab('case')
        // Clear the query param to avoid re-opening on refresh
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, setSearchParams])

  // Always fetch all cases (for accurate counts), then filter locally
  const { data: allCases = [], isLoading: isLoadingCases } = useCases({
    search: searchQuery || undefined,
  })

  // Filter cases based on active tab
  const cases = useMemo(() => {
    if (activeTab === 'active') {
      return allCases.filter((c) => ACTIVE_STAGES.includes(c.stage))
    }
    return allCases
  }, [allCases, activeTab])

  // Fetch full detail only when a case is selected
  const { data: selectedCase } = useCase(selectedCaseId)

  // Fetch full detail only when a client is selected
  const { data: selectedClient } = useClient(selectedClientId)

  // Get active clients for the create case dropdown
  const { data: clients = [] } = useClients({ status: 'active' })

  // Get bank products for bank icons
  const { data: bankProducts = [] } = useBankProducts()

  // Create unique banks list for dropdowns
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

  const logCall = useLogCaseCall()
  const addNote = useAddCaseNote()
  const advanceStage = useAdvanceStage()
  const declineCase = useDeclineCase()
  const withdrawCase = useWithdrawCase()
  const uploadBankForm = useUploadBankForm()
  const deleteBankForm = useDeleteBankForm()
  const createCase = useCreateCase()
  const updateCase = useUpdateCase()
  const setStage = useSetStage()

  // Drag and drop state
  const [draggingCase, setDraggingCase] = useState<CaseListItem | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (event: DragStartEvent) => {
    const caseData = cases.find(c => c.id === event.active.id)
    if (caseData) setDraggingCase(caseData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingCase(null)
    const { active, over } = event
    if (!over) return
    const caseId = active.id as number
    const newStage = over.id as CaseStage
    const caseData = cases.find(c => c.id === caseId)
    if (caseData && caseData.stage !== newStage) {
      setStage.mutate({ id: caseId, stage: newStage })
    }
  }

  // Client mutations for ClientSidePanel
  const addClientNote = useAddClientNote()
  const logClientCall = useLogClientCall()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()

  // Handle view client - opens client side panel as overlay (keeps case panel open below)
  const handleViewClient = (clientId: number) => {
    setSelectedClientId(clientId)
  }

  // Handle closing client panel
  const handleCloseClientPanel = () => {
    setSelectedClientId(null)
  }

  // Group cases by stage for kanban view
  const casesByStage = useMemo(() => {
    const grouped: Record<CaseStage, CaseListItem[]> = {} as Record<CaseStage, CaseListItem[]>

    // Initialize all active stages
    ACTIVE_STAGES.forEach((stage) => {
      grouped[stage] = []
    })

    // Add terminal stages if viewing all
    if (activeTab === 'all') {
      TERMINAL_STAGES.forEach((stage) => {
        grouped[stage] = []
      })
    }

    // Group cases
    cases.forEach((c) => {
      if (grouped[c.stage]) {
        grouped[c.stage].push(c)
      }
    })

    return grouped
  }, [cases, activeTab])

  // Get counts for tabs - calculated from all cases so counts are stable
  const { activeCount, allCount } = useMemo(() => {
    return {
      activeCount: allCases.filter((c) => ACTIVE_STAGES.includes(c.stage)).length,
      allCount: allCases.length,
    }
  }, [allCases])

  const handleAddNote = (caseId: number) => (content: string) => {
    addNote.mutate({ entityId: caseId, content })
    setInitialPanelTab('activity')
    setSelectedCaseId(caseId)
  }

  const handleLogCall = (caseId: number) => (outcome: CallOutcome, notes?: string) => {
    logCall.mutate({ entityId: caseId, outcome, notes })
    setInitialPanelTab('activity')
    setSelectedCaseId(caseId)
  }

  const handleAdvanceStage = (caseId: number, notes?: string) => {
    advanceStage.mutate({ id: caseId, notes })
    setInitialPanelTab('activity')
    setSelectedCaseId(caseId)
  }

  const handleDecline = (caseId: number, reason?: string) => {
    declineCase.mutate({ entityId: caseId, status: 'declined', reason })
    setInitialPanelTab('activity')
    setSelectedCaseId(caseId)
  }

  const handleWithdraw = (caseId: number, reason?: string) => {
    withdrawCase.mutate({ entityId: caseId, status: 'withdrawn', reason })
    setInitialPanelTab('activity')
    setSelectedCaseId(caseId)
  }

  const handleUploadBankForm = (caseId: number, type: BankFormType, file: File) => {
    uploadBankForm.mutate({ id: caseId, type, file })
  }

  const handleCreateCase = (data: CreateCaseData) => {
    setShowCreatePanel(false)  // Close immediately
    createCase.mutate(data)    // API call in background
  }

  const getStageColor = (stage: CaseStage) => {
    if (stage === 'disbursed') return 'bg-emerald-100 text-emerald-700'
    if (stage === 'declined') return 'bg-red-100 text-red-700'
    if (stage === 'withdrawn') return 'bg-slate-200 text-slate-500'
    return 'bg-emerald-100 text-emerald-700'
  }

  const getKanbanColumnColor = (stage: CaseStage) => {
    if (stage === 'disbursed') return 'border-green-200 bg-green-50'
    if (stage === 'declined') return 'border-red-200 bg-red-50'
    if (stage === 'withdrawn') return 'border-slate-200 bg-slate-50'
    return 'border-slate-200'
  }

  // Droppable column component
  const DroppableColumn = ({ stage, children }: { stage: CaseStage; children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage })
    return (
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 w-72 rounded-lg border transition-colors ${getKanbanColumnColor(stage)} ${isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
      >
        {children}
      </div>
    )
  }

  // Draggable card component
  const DraggableCard = ({ caseData }: { caseData: CaseListItem }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: caseData.id })
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => {
          setInitialPanelTab('case')
          setSelectedCaseId(caseData.id)
        }}
        className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      >
        <div className="mb-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {caseData.caseId}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {caseData.client.firstName} {caseData.client.lastName}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          AED {caseData.loanAmount.toLocaleString()}
        </p>
        {caseData.bankName && (
          <div className="flex items-center gap-1.5 mt-2">
            {caseData.bankIcon ? (
              <img src={caseData.bankIcon} alt={caseData.bankName} className="w-4 h-4 object-contain" />
            ) : (
              <span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded text-[7px] font-medium text-slate-500">
                {caseData.bankName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="text-xs text-slate-500">{caseData.bankName}</span>
          </div>
        )}
      </div>
    )
  }

  // Card content for drag overlay
  const CardContent = ({ caseData }: { caseData: CaseListItem }) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-xl w-72">
      <div className="mb-2">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {caseData.caseId}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {caseData.client.firstName} {caseData.client.lastName}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        AED {caseData.loanAmount.toLocaleString()}
      </p>
      {caseData.bankName && (
        <div className="flex items-center gap-1.5 mt-2">
          {caseData.bankIcon ? (
            <img src={caseData.bankIcon} alt={caseData.bankName} className="w-4 h-4 object-contain" />
          ) : (
            <span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded text-[7px] font-medium text-slate-500">
              {caseData.bankName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-xs text-slate-500">{caseData.bankName}</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Cases</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor mortgage cases through pipeline
              </p>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Case
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center">
                <TabButton
                  active={activeTab === 'active'}
                  onClick={() => setActiveTab('active')}
                  count={isLoadingCases ? undefined : activeCount}
                >
                  Active
                </TabButton>
                <TabButton
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                  count={isLoadingCases ? undefined : allCount}
                >
                  All
                </TabButton>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded ${viewType === 'list' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <List className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                onClick={() => setViewType('kanban')}
                className={`p-2 rounded ${viewType === 'kanban' ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewType === 'list' ? (
          // List View
          <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bank
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Case
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="text-left px-3 py-3 align-middle text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="w-24 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {cases.map((caseData) => (
                <tr
                  key={caseData.id}
                  onClick={() => {
                    setInitialPanelTab('case')
                    setSelectedCaseId(caseData.id)
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {caseData.bankIcon ? (
                        <img
                          src={caseData.bankIcon}
                          alt={caseData.bankName || ''}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-[10px] font-medium text-slate-500">
                          {caseData.bankName ? caseData.bankName.slice(0, 2).toUpperCase() : '—'}
                        </span>
                      )}
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {caseData.bankName || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-sm text-slate-900 dark:text-white">{caseData.caseId}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {caseData.client.firstName} {caseData.client.lastName}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStageColor(caseData.stage)}`}>
                      {STAGE_LABELS[caseData.stage]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                    AED {caseData.loanAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(caseData.updatedAt || caseData.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-2 py-3">
                    {ACTIVE_STAGES.includes(caseData.stage) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewClient(caseData.client.id)
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="View Client"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <NoteAction onAddNote={handleAddNote(caseData.id)} />
                        <PhoneAction phone={caseData.client.phone} onLogCall={handleLogCall(caseData.id)} />
                        <RowActionsDropdown
                          actions={[
                            ...(getNextStageLabel(caseData.stage) ? [{
                              label: getNextStageLabel(caseData.stage)!,
                              onClick: (notes?: string) => handleAdvanceStage(caseData.id, notes),
                              variant: 'success' as const,
                              placeholder: 'Notes for stage change?',
                            }] : []),
                            {
                              label: 'Withdraw',
                              onClick: (notes?: string) => handleWithdraw(caseData.id, notes || ''),
                              variant: 'warning',
                              placeholder: 'Reason for withdrawal?',
                            },
                            {
                              label: 'Decline',
                              onClick: (notes?: string) => handleDecline(caseData.id, notes || ''),
                              variant: 'danger',
                              placeholder: 'Reason for decline?',
                            },
                          ]}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && (
            <EmptyState message="No cases found" />
          )}
          </div>
        ) : (
          // Kanban View with Drag and Drop
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto px-4 pb-4">
              <div className="flex gap-4 h-full">
                {Object.entries(casesByStage).map(([stage, stageCases]) => (
                  <DroppableColumn key={stage} stage={stage as CaseStage}>
                    {/* Column Header */}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {STAGE_LABELS[stage as CaseStage]}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {stageCases.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                      {stageCases.map((caseData) => (
                        <DraggableCard key={caseData.id} caseData={caseData} />
                      ))}
                      {stageCases.length === 0 && (
                        <div className="text-center py-4 text-sm text-slate-400">
                          No cases
                        </div>
                      )}
                    </div>
                  </DroppableColumn>
                ))}
              </div>
            </div>
            <DragOverlay>
              {draggingCase && <CardContent caseData={draggingCase} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Side Panel - View Mode */}
      {selectedCaseId && selectedCase && (
        <CaseSidePanel
          mode="view"
          caseData={selectedCase}
          onClose={() => setSelectedCaseId(null)}
          onAddNote={handleAddNote(selectedCase.id)}
          onLogCall={handleLogCall(selectedCase.id)}
          onAdvanceStage={(notes) => handleAdvanceStage(selectedCase.id, notes)}
          onDecline={(reason) => handleDecline(selectedCase.id, reason)}
          onWithdraw={(reason) => handleWithdraw(selectedCase.id, reason)}
          onUploadBankForm={(type, file) => handleUploadBankForm(selectedCase.id, type, file)}
          onDeleteBankForm={(formId) => deleteBankForm.mutate({ caseId: selectedCase.id, formId })}
          onUpdate={(data) => {
            updateCase.mutate({ id: selectedCase.id, data })
            setSelectedCaseId(null)  // Close panel after update
          }}
          onViewClient={handleViewClient}
          initialTab={initialPanelTab}
          banks={banks}
        />
      )}

      {/* Side Panel - Create Mode */}
      <CaseSidePanel
        mode="create"
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onCreate={handleCreateCase}
        clients={clients.map(c => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
        }))}
        banks={banks}
        onViewClient={handleViewClient}
      />

      {/* Client Side Panel - View Mode (overlays on top of case panels) */}
      {selectedClientId && selectedClient && (
        <ClientSidePanel
          mode="view"
          client={selectedClient}
          onClose={handleCloseClientPanel}
          onAddNote={(content) => addClientNote.mutate({ entityId: selectedClient.id, content })}
          onLogCall={(outcome, notes) => logClientCall.mutate({ entityId: selectedClient.id, outcome, notes })}
          onUploadDocument={(type, file) => uploadDocument.mutate({ id: selectedClient.id, type, file })}
          onDeleteDocument={(documentId) => deleteDocument.mutate({ clientId: selectedClient.id, documentId })}
          onMarkNotProceeding={() => {}}
          onMarkNotEligible={() => {}}
          onCreateCase={() => {}}
        />
      )}
    </div>
  )
}
