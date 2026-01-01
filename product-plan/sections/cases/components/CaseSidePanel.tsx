import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Check,
  Clock,
  Edit3,
  Save,
  Eye,
  Phone,
  StickyNote,
  MoreHorizontal,
  ExternalLink,
  Building2,
} from 'lucide-react'
import type {
  Case,
  BankForm,
  BankFormType,
  BankFormStatus,
  CallOutcome,
  CaseType,
  ServiceType,
  ApplicationType,
  MortgageType,
  Emirate,
  TransactionType,
  PropertyStatus,
  ClientSummary,
  Bank,
  CaseStage,
} from '@/../product/sections/cases/types'
import {
  CASE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  APPLICATION_TYPE_LABELS,
  MORTGAGE_TYPE_LABELS,
  EMIRATE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  BANK_FORM_TYPE_LABELS,
  CASE_STAGE_LABELS,
  getNextStage,
  isTerminalStage,
} from '@/../product/sections/cases/types'
import { SidePanel, SidePanelTabs, SidePanelContent, SidePanelStatus } from '@/components/SidePanel'
import { ActivityView } from '@/components/ActivityView'
import { SectionHeader } from '@/components/InfoBox'
import { ActionPopover } from '@/components/ActionPopover'

interface CaseSidePanelProps {
  caseItem?: Case
  client?: ClientSummary
  banks: Bank[]
  clients: ClientSummary[]
  isOpen: boolean
  isCreateMode?: boolean
  initialTab?: 'deal' | 'activity'
  onClose: () => void
  onUpdateCase: (updates: Partial<Case>) => void
  onUploadBankForm: (formType: BankFormType, file: File) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onAddNote?: (content: string) => void
  onAdvanceStage: (notes?: string) => void
  onDecline: (reason: string) => void
  onWithdraw: (reason: string) => void
  onCreateCase?: (caseData: Omit<Case, 'id' | 'caseId' | 'createdAt' | 'bankForms' | 'callLogs' | 'notes' | 'stageChanges'>) => void
}

type TabView = 'deal' | 'documents' | 'whatsapp' | 'activity'

// Case action options for MoreActions popover
const getCaseActionOptions = (stage: CaseStage) => {
  const nextStage = getNextStage(stage)
  return [
    {
      id: 'advance',
      label: nextStage ? `Advance to ${CASE_STAGE_LABELS[nextStage]}` : 'Complete',
      placeholder: 'Notes about this stage?',
      variant: 'success' as const
    },
    { id: 'decline', label: 'Decline', placeholder: 'Reason for decline?', variant: 'danger' as const },
    { id: 'withdraw', label: 'Withdraw', placeholder: 'Reason for withdrawal?', variant: 'danger' as const },
  ]
}

const bankFormStatusConfig: Record<BankFormStatus, { icon: React.ReactNode; text: string; color: string }> = {
  missing: { icon: <Clock className="w-4 h-4" strokeWidth={1.5} />, text: 'Missing', color: 'text-slate-400' },
  uploaded: { icon: <Check className="w-4 h-4" strokeWidth={1.5} />, text: 'Uploaded', color: 'text-blue-500' },
  verified: { icon: <Check className="w-4 h-4" strokeWidth={1.5} />, text: 'Verified', color: 'text-emerald-500' },
}

// All bank form types in order
const allBankFormTypes: BankFormType[] = [
  'accountOpeningForm',
  'fts',
  'kfs',
  'undertakings',
  'bankChecklist',
]

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return ''
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CaseSidePanel({
  caseItem,
  client,
  banks,
  clients,
  isOpen,
  isCreateMode,
  initialTab = 'deal',
  onClose,
  onUpdateCase,
  onUploadBankForm,
  onLogCall,
  onAddNote,
  onAdvanceStage,
  onDecline,
  onWithdraw,
  onCreateCase,
}: CaseSidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabView>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [editedCase, setEditedCase] = useState<Partial<Case>>({})
  const [newCase, setNewCase] = useState<Partial<Case>>({})
  const [phoneCopied, setPhoneCopied] = useState(false)
  const [notePopoverOpen, setNotePopoverOpen] = useState(false)
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)

  const noteButtonRef = useRef<HTMLButtonElement>(null)
  const phoneButtonRef = useRef<HTMLButtonElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    setPhoneCopied(true)
    setTimeout(() => setPhoneCopied(false), 2000)
  }

  const handlePhoneClick = () => {
    if (client?.phone) {
      handleCopyPhone(client.phone)
      setPhoneDropdownOpen(true)
    }
  }

  // Sync activeTab with initialTab when it changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [initialTab, isOpen])

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      setEditedCase({})
      setNewCase({})
      setPhoneCopied(false)
      setNotePopoverOpen(false)
      setPhoneDropdownOpen(false)
      setMoreActionsOpen(false)
    }
  }, [isOpen])

  // Initialize edited case when case changes
  useEffect(() => {
    if (caseItem) {
      setEditedCase({})
    }
  }, [caseItem?.id])

  // Handle create mode
  if (isCreateMode) {
    const handleNewFieldChange = <K extends keyof Case>(field: K, value: Case[K]) => {
      setNewCase(prev => ({ ...prev, [field]: value }))
    }

    const handleCreateCase = () => {
      if (
        newCase.clientId &&
        newCase.caseType &&
        newCase.serviceType &&
        newCase.applicationType &&
        newCase.bankSelection?.length &&
        newCase.mortgageType &&
        newCase.emirate &&
        newCase.loanAmount &&
        newCase.transactionType &&
        newCase.mortgageTerm &&
        newCase.estimatedPropertyValue &&
        newCase.propertyStatus
      ) {
        onCreateCase?.({
          clientId: newCase.clientId,
          caseType: newCase.caseType,
          serviceType: newCase.serviceType,
          applicationType: newCase.applicationType,
          bankSelection: newCase.bankSelection,
          mortgageType: newCase.mortgageType,
          emirate: newCase.emirate,
          loanAmount: newCase.loanAmount,
          transactionType: newCase.transactionType,
          mortgageTerm: newCase.mortgageTerm,
          estimatedPropertyValue: newCase.estimatedPropertyValue,
          propertyStatus: newCase.propertyStatus,
          stage: 'processing',
        })
        onClose()
      }
    }

    const isFormValid =
      newCase.clientId &&
      newCase.caseType &&
      newCase.serviceType &&
      newCase.applicationType &&
      newCase.bankSelection?.length &&
      newCase.mortgageType &&
      newCase.emirate &&
      newCase.loanAmount &&
      newCase.transactionType &&
      newCase.mortgageTerm?.years !== undefined &&
      newCase.estimatedPropertyValue &&
      newCase.propertyStatus

    return (
      <SidePanel isOpen={isOpen} onClose={onClose} title="New Case">
        <SidePanelContent className="space-y-5">
          {/* Client Selection */}
          <div>
            <SectionHeader>Client</SectionHeader>
            <select
              value={newCase.clientId || ''}
              onChange={(e) => handleNewFieldChange('clientId', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Case Type Section */}
          <div>
            <SectionHeader>Case Type</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableSelect
                label="Case Type"
                value={newCase.caseType || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('caseType', v as CaseType)}
                options={Object.entries(CASE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <EditableSelect
                label="Service Type"
                value={newCase.serviceType || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('serviceType', v as ServiceType)}
                options={Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <EditableSelect
                label="Application Type"
                value={newCase.applicationType || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('applicationType', v as ApplicationType)}
                options={Object.entries(APPLICATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <EditableSelect
                label="Mortgage Type"
                value={newCase.mortgageType || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('mortgageType', v as MortgageType)}
                options={Object.entries(MORTGAGE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <SectionHeader>Bank Selection</SectionHeader>
            <BankMultiSelect
              banks={banks}
              selected={newCase.bankSelection || []}
              onChange={(selected) => handleNewFieldChange('bankSelection', selected)}
              maxSelections={3}
            />
          </div>

          {/* Property Section */}
          <div>
            <SectionHeader>Property</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableSelect
                label="Emirate"
                value={newCase.emirate || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('emirate', v as Emirate)}
                options={Object.entries(EMIRATE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <EditableSelect
                label="Property Status"
                value={newCase.propertyStatus || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('propertyStatus', v as PropertyStatus)}
                options={Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <EditableField
                label="Est. Property Value"
                value={newCase.estimatedPropertyValue || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('estimatedPropertyValue', v ? parseInt(v) : 0)}
                type="currency"
                span={2}
              />
            </div>
          </div>

          {/* Loan Section */}
          <div>
            <SectionHeader>Loan</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="Loan Amount"
                value={newCase.loanAmount || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('loanAmount', v ? parseInt(v) : 0)}
                type="currency"
              />
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Mortgage Term
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Years"
                    min={1}
                    max={25}
                    value={newCase.mortgageTerm?.years || ''}
                    onChange={(e) => handleNewFieldChange('mortgageTerm', {
                      years: parseInt(e.target.value) || 0,
                      months: newCase.mortgageTerm?.months || 0,
                    })}
                    className="w-1/2 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Months"
                    min={0}
                    max={11}
                    value={newCase.mortgageTerm?.months || ''}
                    onChange={(e) => handleNewFieldChange('mortgageTerm', {
                      years: newCase.mortgageTerm?.years || 0,
                      months: parseInt(e.target.value) || 0,
                    })}
                    className="w-1/2 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <EditableSelect
                label="Transaction Type"
                value={newCase.transactionType || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('transactionType', v as TransactionType)}
                options={Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                span={2}
              />
            </div>
          </div>
        </SidePanelContent>

        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleCreateCase}
            disabled={!isFormValid}
            className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
              isFormValid
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-slate-400 bg-slate-100 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            Create Case
          </button>
        </div>
      </SidePanel>
    )
  }

  if (!caseItem) return null

  const isTerminal = isTerminalStage(caseItem.stage)
  const missingForms = caseItem.bankForms.filter(f => f.status === 'missing')

  const handleSaveDeal = () => {
    if (Object.keys(editedCase).length > 0) {
      onUpdateCase(editedCase)
    }
    setIsEditing(false)
    setEditedCase({})
  }

  const handleFieldChange = <K extends keyof Case>(field: K, value: Case[K]) => {
    setEditedCase(prev => ({ ...prev, [field]: value }))
  }

  const getFieldValue = <K extends keyof Case>(field: K): Case[K] => {
    if (field in editedCase) {
      return editedCase[field] as Case[K]
    }
    return caseItem[field]
  }

  const tabs = [
    { id: 'deal', label: 'Deal' },
    { id: 'documents', label: 'Documents', badge: missingForms.length },
    { id: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
    { id: 'activity', label: 'Activity' },
  ]

  const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'

  // Header actions
  const headerActions = (
    <>
      <button
        ref={noteButtonRef}
        onClick={() => setNotePopoverOpen(true)}
        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        title="Add Note"
      >
        <StickyNote className="w-4 h-4" />
      </button>
      <button
        ref={phoneButtonRef}
        onClick={handlePhoneClick}
        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        title="Log Call"
      >
        {phoneCopied ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
      </button>
      {isTerminal ? (
        <div className="w-7 h-7" />
      ) : (
        <button
          ref={moreButtonRef}
          onClick={() => setMoreActionsOpen(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      )}
    </>
  )

  // Determine status bar config
  const getStatusBarConfig = (): { status: 'success' | 'neutral' | 'danger'; label: string } => {
    switch (caseItem.stage) {
      case 'disbursed':
        return { status: 'success', label: 'Disbursed' }
      case 'declined':
        return { status: 'danger', label: 'Declined' }
      case 'withdrawn':
        return { status: 'neutral', label: 'Withdrawn' }
      default:
        return { status: 'neutral', label: CASE_STAGE_LABELS[caseItem.stage] }
    }
  }

  const statusConfig = getStatusBarConfig()

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div>{clientName}</div>
          <div className="text-sm font-mono text-slate-400 dark:text-slate-500">{caseItem.caseId}</div>
        </div>
      }
      headerActions={headerActions}
    >
      <SidePanelTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabView)}
      />

      {/* Popovers */}
      <ActionPopover
        isOpen={notePopoverOpen}
        onClose={() => setNotePopoverOpen(false)}
        triggerRef={noteButtonRef as React.RefObject<HTMLButtonElement>}
        onConfirm={(_, note) => {
          if (note) {
            onAddNote?.(note)
            setActiveTab('activity')
          }
        }}
        confirmLabel="Add"
      />
      <ActionPopover
        isOpen={phoneDropdownOpen}
        onClose={() => setPhoneDropdownOpen(false)}
        triggerRef={phoneButtonRef as React.RefObject<HTMLButtonElement>}
        options={[
          { id: 'connected', label: 'Connected', placeholder: 'Notes about the call?', variant: 'success' },
          { id: 'noAnswer', label: 'No Answer', placeholder: 'Notes about the attempt?', variant: 'default' },
        ]}
        defaultOptionId="connected"
        onConfirm={(optionId, note) => {
          onLogCall(optionId as CallOutcome, note)
          setActiveTab('activity')
        }}
        confirmLabel="Log Call"
      />
      <ActionPopover
        isOpen={moreActionsOpen}
        onClose={() => setMoreActionsOpen(false)}
        triggerRef={moreButtonRef as React.RefObject<HTMLButtonElement>}
        options={getCaseActionOptions(caseItem.stage)}
        defaultOptionId="advance"
        onConfirm={(optionId, note) => {
          if (optionId === 'advance') {
            onAdvanceStage(note)
          } else if (optionId === 'decline') {
            if (note) onDecline(note)
          } else if (optionId === 'withdraw') {
            if (note) onWithdraw(note)
          }
          setActiveTab('activity')
        }}
        confirmLabel="Confirm"
      />

      {/* WhatsApp View */}
      {activeTab === 'whatsapp' && (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">yCloud Chat (embedded iframe)</p>
        </div>
      )}

      {/* Activity View */}
      {activeTab === 'activity' && (
        <ActivityView
          entityType="case"
          createdAt={caseItem.createdAt}
          notes={caseItem.notes || []}
          callLogs={caseItem.callLogs.map(c => ({
            id: c.id,
            outcome: c.outcome as 'connected' | 'noAnswer',
            timestamp: c.timestamp,
            notes: c.notes,
          }))}
          stageChanges={(caseItem.stageChanges || []).map(sc => ({
            id: sc.id,
            fromStage: sc.fromStage,
            toStage: sc.toStage,
            timestamp: sc.timestamp,
            notes: sc.notes,
          }))}
        />
      )}

      {/* Documents View */}
      {activeTab === 'documents' && (
        <SidePanelContent className="space-y-6">
          {/* Client Documents (read-only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Client Documents (8)
              </h3>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                View
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-sm text-slate-500 dark:text-slate-400">
              Documents are linked from the client record
            </div>
          </div>

          {/* Bank Forms */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Bank Forms ({allBankFormTypes.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {allBankFormTypes.map((formType) => {
                const form = caseItem.bankForms.find(f => f.type === formType) || {
                  id: formType,
                  type: formType,
                  status: 'missing' as BankFormStatus,
                }
                return (
                  <BankFormRow
                    key={formType}
                    form={form}
                    onUpload={(file) => onUploadBankForm(formType, file)}
                  />
                )
              })}
            </div>
          </div>
        </SidePanelContent>
      )}

      {/* Deal View */}
      {activeTab === 'deal' && (
        <>
          <SidePanelContent className="space-y-5">
            {/* Case Type Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Case Type
                </h3>
                {isEditing ? (
                  <button
                    onClick={handleSaveDeal}
                    className="p-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    title="Save"
                  >
                    <Save className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableSelect
                  label="Case Type"
                  value={getFieldValue('caseType')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('caseType', v as CaseType)}
                  options={Object.entries(CASE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <EditableSelect
                  label="Service Type"
                  value={getFieldValue('serviceType')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('serviceType', v as ServiceType)}
                  options={Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <EditableSelect
                  label="Application Type"
                  value={getFieldValue('applicationType')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('applicationType', v as ApplicationType)}
                  options={Object.entries(APPLICATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <EditableSelect
                  label="Mortgage Type"
                  value={getFieldValue('mortgageType')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('mortgageType', v as MortgageType)}
                  options={Object.entries(MORTGAGE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <SectionHeader>Bank Selection</SectionHeader>
              {isEditing ? (
                <BankMultiSelect
                  banks={banks}
                  selected={getFieldValue('bankSelection')}
                  onChange={(selected) => handleFieldChange('bankSelection', selected)}
                  maxSelections={3}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {caseItem.bankSelection.map(bankId => {
                    const bank = banks.find(b => b.id === bankId)
                    return (
                      <span
                        key={bankId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded"
                      >
                        <Building2 className="w-3 h-3" strokeWidth={1.5} />
                        {bank?.name || bankId}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Property Section */}
            <div>
              <SectionHeader>Property</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                <EditableSelect
                  label="Emirate"
                  value={getFieldValue('emirate')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('emirate', v as Emirate)}
                  options={Object.entries(EMIRATE_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <EditableSelect
                  label="Property Status"
                  value={getFieldValue('propertyStatus')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('propertyStatus', v as PropertyStatus)}
                  options={Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <EditableField
                  label="Est. Property Value"
                  value={getFieldValue('estimatedPropertyValue')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('estimatedPropertyValue', v ? parseInt(v) : 0)}
                  type="currency"
                  span={2}
                />
              </div>
            </div>

            {/* Loan Section */}
            <div>
              <SectionHeader>Loan</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Loan Amount"
                  value={getFieldValue('loanAmount')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('loanAmount', v ? parseInt(v) : 0)}
                  type="currency"
                />
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Mortgage Term
                  </label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Years"
                        min={1}
                        max={25}
                        value={getFieldValue('mortgageTerm')?.years || ''}
                        onChange={(e) => handleFieldChange('mortgageTerm', {
                          years: parseInt(e.target.value) || 0,
                          months: getFieldValue('mortgageTerm')?.months || 0,
                        })}
                        className="w-1/2 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Months"
                        min={0}
                        max={11}
                        value={getFieldValue('mortgageTerm')?.months || ''}
                        onChange={(e) => handleFieldChange('mortgageTerm', {
                          years: getFieldValue('mortgageTerm')?.years || 0,
                          months: parseInt(e.target.value) || 0,
                        })}
                        className="w-1/2 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {caseItem.mortgageTerm.years} years
                      {caseItem.mortgageTerm.months > 0 && ` ${caseItem.mortgageTerm.months} months`}
                    </p>
                  )}
                </div>
                <EditableSelect
                  label="Transaction Type"
                  value={getFieldValue('transactionType')}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('transactionType', v as TransactionType)}
                  options={Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                  span={2}
                />
              </div>
            </div>

            {/* Client Info (read-only) */}
            {client && (
              <div>
                <SectionHeader>Client Info</SectionHeader>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {client.phone}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    DBR {client.estimatedDBR ?? '—'}% · LTV {client.estimatedLTV ?? '—'}%
                  </p>
                </div>
              </div>
            )}
          </SidePanelContent>

          {/* Stage Status Bar */}
          <SidePanelStatus
            status={statusConfig.status === 'danger' ? 'neutral' : statusConfig.status}
          >
            <span className={statusConfig.status === 'danger' ? 'text-red-600 dark:text-red-400' : ''}>
              {statusConfig.label}
            </span>
          </SidePanelStatus>
        </>
      )}
    </SidePanel>
  )
}

// Sub-components

interface EditableFieldProps {
  label: string
  value: string | number | null
  isEditing: boolean
  onChange: (value: string) => void
  type?: 'text' | 'currency'
  span?: number
}

function EditableField({ label, value, isEditing, onChange, type = 'text', span = 1 }: EditableFieldProps) {
  const displayValue = type === 'currency' && value !== null && value !== ''
    ? formatCurrency(typeof value === 'string' ? parseInt(value) : value as number)
    : (value?.toString() || '—')

  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      {isEditing ? (
        <input
          type={type === 'currency' ? 'number' : 'text'}
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {displayValue}
        </p>
      )}
    </div>
  )
}

interface EditableSelectProps {
  label: string
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  span?: number
}

function EditableSelect({ label, value, isEditing, onChange, options, span = 1 }: EditableSelectProps) {
  const displayValue = options.find(o => o.value === value)?.label || '—'

  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      {isEditing ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {displayValue}
        </p>
      )}
    </div>
  )
}

interface BankMultiSelectProps {
  banks: Bank[]
  selected: string[]
  onChange: (selected: string[]) => void
  maxSelections: number
}

function BankMultiSelect({ banks, selected, onChange, maxSelections }: BankMultiSelectProps) {
  const toggleBank = (bankId: string) => {
    if (selected.includes(bankId)) {
      onChange(selected.filter(id => id !== bankId))
    } else if (selected.length < maxSelections) {
      onChange([...selected, bankId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {banks.map(bank => {
        const isSelected = selected.includes(bank.id)
        const isDisabled = !isSelected && selected.length >= maxSelections

        return (
          <button
            key={bank.id}
            type="button"
            onClick={() => toggleBank(bank.id)}
            disabled={isDisabled}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors
              ${isSelected
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : isDisabled
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }
            `}
          >
            <Building2 className="w-3 h-3" strokeWidth={1.5} />
            {bank.name}
            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
          </button>
        )
      })}
      <span className="text-xs text-slate-400 dark:text-slate-500 self-center">
        {selected.length}/{maxSelections} selected
      </span>
    </div>
  )
}

interface BankFormRowProps {
  form: BankForm
  onUpload: (file: File) => void
}

function BankFormRow({ form, onUpload }: BankFormRowProps) {
  const config = bankFormStatusConfig[form.status]
  const isActionable = form.status === 'missing'

  const handleFileSelect = () => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onUpload(file)
    }
    input.click()
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={config.color}>
          {config.icon}
        </span>
        <span className={`text-sm ${
          form.status === 'uploaded' || form.status === 'verified'
            ? 'text-slate-900 dark:text-white'
            : 'text-slate-600 dark:text-slate-300'
        }`}>
          {BANK_FORM_TYPE_LABELS[form.type]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {(form.status === 'uploaded' || form.status === 'verified') && (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {form.uploadedAt && formatRelativeTime(form.uploadedAt)}
            </span>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
              title="View document"
            >
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </>
        )}

        {isActionable && (
          <button
            onClick={handleFileSelect}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Upload
          </button>
        )}
      </div>
    </div>
  )
}