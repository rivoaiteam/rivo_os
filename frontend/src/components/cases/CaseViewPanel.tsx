/**
 * Case View Panel Component
 * Single responsibility: Viewing and editing existing cases
 */

import { useState } from 'react'
import { FileText, Upload, ExternalLink, Phone, GitCommit, X, Pencil } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Case, CallOutcome, BankFormType, CaseStage, ApplicationType, MortgageType, Emirate, TransactionType, PropertyStatus, RateType, RateTerm } from '@/types/cases'
import { STAGE_LABELS, EMIRATE_LABELS, BANK_FORM_LABELS, ACTIVE_STAGES, TERMINAL_STAGES } from '@/types/cases'
import { SidePanel, SidePanelTabs, SidePanelContent } from '@/components/ui/SidePanel'
import { EntityActions } from '@/components/shared'
import { SectionHeader, InfoField } from '@/components/ui/InfoBox'
import { DocumentList, type DocumentItem } from '@/components/ui/DocumentList'
import { detectBankFormType } from '@/utils/documentDetection'

interface BankInfo {
  name: string
  icon?: string
}

type TabType = 'case' | 'documents' | 'activity'

interface CaseViewPanelProps {
  isOpen?: boolean
  caseData: Case
  onClose: () => void
  onAddNote: (content: string) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onAdvanceStage: (notes?: string) => void
  onDecline: (reason?: string) => void
  onWithdraw: (reason?: string) => void
  onUploadBankForm: (type: BankFormType, file: File) => void
  onDeleteBankForm?: (formId: number) => void
  onUpdate?: (data: Partial<Case>) => void
  onViewClient?: (clientId: number) => void
  initialTab?: TabType
  banks?: BankInfo[]
}

const INPUT_CLASSES = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500'

const TABS = [
  { id: 'case', label: 'Case' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
]

export function CaseViewPanel({
  isOpen = true,
  caseData,
  onClose,
  onAddNote,
  onLogCall,
  onAdvanceStage,
  onDecline,
  onWithdraw,
  onUploadBankForm,
  onDeleteBankForm,
  onUpdate,
  onViewClient,
  initialTab = 'case',
  banks = [],
}: CaseViewPanelProps) {
  // Local UI state only
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Case>>({})
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null)

  // Derived state - computed, not stored
  const isTerminal = TERMINAL_STAGES.includes(caseData.stage)
  const isActive = ACTIVE_STAGES.includes(caseData.stage)
  const ltv = caseData.estimatedPropertyValue > 0
    ? (caseData.loanAmount / caseData.estimatedPropertyValue * 100)
    : 0

  const getStageColor = (stage: CaseStage) => {
    if (stage === 'disbursed') return 'bg-emerald-100 text-emerald-700'
    if (stage === 'declined') return 'bg-red-100 text-red-700'
    if (stage === 'withdrawn') return 'bg-slate-200 text-slate-500'
    return 'bg-emerald-100 text-emerald-700'
  }

  // Edit mode handlers
  const startEditing = () => {
    setEditData({
      caseType: caseData.caseType,
      serviceType: caseData.serviceType,
      applicationType: caseData.applicationType,
      mortgageType: caseData.mortgageType,
      emirate: caseData.emirate,
      transactionType: caseData.transactionType,
      propertyStatus: caseData.propertyStatus,
      estimatedPropertyValue: caseData.estimatedPropertyValue,
      loanAmount: caseData.loanAmount,
      mortgageTermYears: caseData.mortgageTermYears,
      mortgageTermMonths: caseData.mortgageTermMonths,
      bankName: caseData.bankName,
      rateType: caseData.rateType,
      ratePercent: caseData.ratePercent,
      fixedPeriodYears: caseData.fixedPeriodYears,
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditData({})
  }

  const saveEdits = () => {
    if (onUpdate) {
      onUpdate(editData)
      setIsEditing(false)
    }
  }

  const updateEditField = <K extends keyof Case>(field: K, value: Case[K]) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  // File upload handler
  const uploadFiles = (files: FileList) => {
    const assignedTypes = new Set<BankFormType>()

    Array.from(files).forEach(file => {
      let detectedType = detectBankFormType(file.name)

      if (detectedType !== 'other' && assignedTypes.has(detectedType)) {
        detectedType = 'other'
      }

      if (detectedType !== 'other') {
        assignedTypes.add(detectedType)
      }

      onUploadBankForm(detectedType, file)
    })
  }

  // Header actions
  const headerActions = (
    <EntityActions
      entityType="case"
      phone={caseData.client.phone}
      isTerminal={isTerminal}
      clientId={caseData.client.id}
      onAddNote={onAddNote}
      onLogCall={onLogCall}
      onGoToClient={onViewClient}
      onAdvanceStage={onAdvanceStage}
      onDecline={onDecline}
      onWithdraw={onWithdraw}
      onViewModeChange={(mode) => setActiveTab(mode === 'activity' ? 'activity' : 'case')}
    />
  )

  // Title with stage badge
  const title = (
    <>
      {caseData.caseId}{' '}
      <span className={`ml-1 px-2 py-0.5 text-xs font-normal rounded ${getStageColor(caseData.stage)}`}>
        {STAGE_LABELS[caseData.stage]}
      </span>
    </>
  )

  return (
    <>
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={`${caseData.client.firstName} ${caseData.client.lastName}`}
        headerActions={headerActions}
      >
        <SidePanelTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabType)}
        />

        <SidePanelContent className="space-y-6">
          {activeTab === 'case' && (
            <CaseTab
              caseData={caseData}
              isEditing={isEditing}
              editData={editData}
              isTerminal={isTerminal}
              ltv={ltv}
              banks={banks}
              onStartEdit={startEditing}
              onCancelEdit={cancelEditing}
              onSaveEdit={saveEdits}
              onUpdateField={updateEditField}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab
              caseData={caseData}
              isActive={isActive}
              onUploadFiles={uploadFiles}
              onPreviewDoc={setPreviewDoc}
              onDeleteBankForm={onDeleteBankForm}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab caseData={caseData} />
          )}
        </SidePanelContent>
      </SidePanel>

      {/* Document Preview */}
      {previewDoc && (
        <DocumentPreview
          url={previewDoc.url}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  )
}

// Sub-components

interface CaseTabProps {
  caseData: Case
  isEditing: boolean
  editData: Partial<Case>
  isTerminal: boolean
  ltv: number
  banks: BankInfo[]
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onUpdateField: <K extends keyof Case>(field: K, value: Case[K]) => void
}

function CaseTab({ caseData, isEditing, editData, isTerminal, ltv, banks, onStartEdit, onCancelEdit, onSaveEdit, onUpdateField }: CaseTabProps) {
  if (isEditing) {
    return (
      <CaseEditForm
        editData={editData}
        banks={banks}
        onUpdateField={onUpdateField}
        onCancel={onCancelEdit}
        onSave={onSaveEdit}
      />
    )
  }

  return (
    <div className="space-y-6 relative">
      {!isTerminal && (
        <button
          onClick={onStartEdit}
          className="absolute top-0 right-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Edit Case"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Deal Info */}
      <div>
        <SectionHeader>Deal Information</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <InfoField label="Case Type" value={caseData.caseType === 'residential' ? 'Residential' : 'Commercial'} />
          <InfoField label="Service Type" value={caseData.serviceType === 'fullyPackaged' ? 'Fully Packaged' : 'Assisted'} />
          <InfoField label="Application" value={caseData.applicationType === 'joint' ? 'Joint' : 'Individual'} />
        </div>
      </div>

      {/* Property Info */}
      <div>
        <SectionHeader>Property</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <InfoField label="Emirate" value={EMIRATE_LABELS[caseData.emirate]} />
          <InfoField label="Transaction Type" value={caseData.transactionType.replace(/([A-Z])/g, ' $1').trim()} />
          <InfoField label="Property Status" value={caseData.propertyStatus === 'ready' ? 'Ready' : 'Under Construction'} />
          <InfoField label="Property Value" value={`AED ${caseData.estimatedPropertyValue.toLocaleString()}`} />
        </div>
      </div>

      {/* Loan Info */}
      <div>
        <SectionHeader>Loan</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <InfoField label="Loan Amount" value={`AED ${caseData.loanAmount.toLocaleString()}`} />
          <InfoField label="Mortgage Term" value={`${caseData.mortgageTermYears}y ${caseData.mortgageTermMonths}m`} />
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">LTV</label>
            <p className={`text-sm font-medium ${ltv > 80 ? 'text-red-600' : 'text-green-600'}`}>
              {ltv.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Bank Product */}
      <div>
        <SectionHeader>Bank Product</SectionHeader>
        {caseData.bankName ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank</label>
              <div className="flex items-center gap-2">
                {banks.find(b => b.name === caseData.bankName)?.icon ? (
                  <img
                    src={banks.find(b => b.name === caseData.bankName)?.icon}
                    alt={caseData.bankName}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-medium text-slate-500">
                    {caseData.bankName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-900 dark:text-white">{caseData.bankName}</span>
              </div>
            </div>
            <InfoField label="Mortgage Type" value={caseData.mortgageType === 'islamic' ? 'Islamic' : 'Conventional'} />
            <InfoField label="Rate Type" value={caseData.rateType === 'fixed' ? 'Fixed' : caseData.rateType === 'variable' ? 'Variable' : '—'} />
            <InfoField label="Rate %" value={caseData.ratePercent ? `${caseData.ratePercent}%` : '—'} />
            <InfoField label="Fixed Period" value={caseData.fixedPeriodYears ? `${caseData.fixedPeriodYears} Year${caseData.fixedPeriodYears > 1 ? 's' : ''}` : '—'} />
          </div>
        ) : (
          <p className="text-sm text-slate-400">No bank product selected</p>
        )}
      </div>
    </div>
  )
}

interface CaseEditFormProps {
  editData: Partial<Case>
  banks: BankInfo[]
  onUpdateField: <K extends keyof Case>(field: K, value: Case[K]) => void
  onCancel: () => void
  onSave: () => void
}

function CaseEditForm({ editData, banks, onUpdateField, onCancel, onSave }: CaseEditFormProps) {
  const selectedBankIcon = banks.find(b => b.name === editData.bankName)?.icon

  return (
    <div className="space-y-6">
      {/* Deal Info */}
      <div>
        <SectionHeader>Deal Information</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Case Type</label>
            <select
              value={editData.caseType || ''}
              onChange={(e) => onUpdateField('caseType', e.target.value as 'residential' | 'commercial')}
              className={INPUT_CLASSES}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Service Type</label>
            <select
              value={editData.serviceType || ''}
              onChange={(e) => onUpdateField('serviceType', e.target.value as 'fullyPackaged' | 'assisted')}
              className={INPUT_CLASSES}
            >
              <option value="fullyPackaged">Fully Packaged</option>
              <option value="assisted">Assisted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Application</label>
            <select
              value={editData.applicationType || ''}
              onChange={(e) => onUpdateField('applicationType', e.target.value as ApplicationType)}
              className={INPUT_CLASSES}
            >
              <option value="individual">Individual</option>
              <option value="joint">Joint</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div>
        <SectionHeader>Property</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Emirate</label>
            <select
              value={editData.emirate || ''}
              onChange={(e) => onUpdateField('emirate', e.target.value as Emirate)}
              className={INPUT_CLASSES}
            >
              {Object.entries(EMIRATE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Transaction Type</label>
            <select
              value={editData.transactionType || ''}
              onChange={(e) => onUpdateField('transactionType', e.target.value as TransactionType)}
              className={INPUT_CLASSES}
            >
              <option value="primaryPurchase">Primary Purchase</option>
              <option value="resale">Resale</option>
              <option value="buyoutEquity">Buyout + Equity</option>
              <option value="buyout">Buyout</option>
              <option value="equity">Equity</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Property Status</label>
            <select
              value={editData.propertyStatus || ''}
              onChange={(e) => onUpdateField('propertyStatus', e.target.value as PropertyStatus)}
              className={INPUT_CLASSES}
            >
              <option value="ready">Ready</option>
              <option value="underConstruction">Under Construction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Property Value (AED)</label>
            <input
              type="number"
              value={editData.estimatedPropertyValue || ''}
              onChange={(e) => onUpdateField('estimatedPropertyValue', Number(e.target.value))}
              className={INPUT_CLASSES}
            />
          </div>
        </div>
      </div>

      {/* Loan Info */}
      <div>
        <SectionHeader>Loan</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Loan Amount (AED)</label>
            <input
              type="number"
              value={editData.loanAmount || ''}
              onChange={(e) => onUpdateField('loanAmount', Number(e.target.value))}
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Mortgage Term</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  value={editData.mortgageTermYears || ''}
                  onChange={(e) => onUpdateField('mortgageTermYears', Number(e.target.value))}
                  min="1"
                  max="30"
                  className={INPUT_CLASSES}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">yrs</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={editData.mortgageTermMonths || ''}
                  onChange={(e) => onUpdateField('mortgageTermMonths', Number(e.target.value))}
                  min="0"
                  max="11"
                  className={INPUT_CLASSES}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Product */}
      <div>
        <SectionHeader>Bank Product</SectionHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank</label>
            <div className="relative">
              <select
                value={editData.bankName || ''}
                onChange={(e) => onUpdateField('bankName', e.target.value)}
                className={`${INPUT_CLASSES} ${selectedBankIcon ? 'pl-9' : ''}`}
              >
                <option value="">Select bank...</option>
                {banks.map((bank) => (
                  <option key={bank.name} value={bank.name}>{bank.name}</option>
                ))}
              </select>
              {selectedBankIcon && (
                <img
                  src={selectedBankIcon}
                  alt=""
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain pointer-events-none"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Mortgage Type</label>
            <select
              value={editData.mortgageType || ''}
              onChange={(e) => onUpdateField('mortgageType', e.target.value as MortgageType)}
              className={INPUT_CLASSES}
            >
              <option value="islamic">Islamic</option>
              <option value="conventional">Conventional</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Rate Type</label>
            <select
              value={editData.rateType || ''}
              onChange={(e) => onUpdateField('rateType', e.target.value as RateType)}
              className={INPUT_CLASSES}
            >
              <option value="">Select type...</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Rate %</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={editData.ratePercent || ''}
              onChange={(e) => onUpdateField('ratePercent', Number(e.target.value))}
              placeholder="3.99"
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Fixed Period</label>
            <select
              value={editData.fixedPeriodYears || ''}
              onChange={(e) => onUpdateField('fixedPeriodYears', Number(e.target.value) as RateTerm)}
              className={INPUT_CLASSES}
            >
              <option value="">Select period...</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="4">4 Years</option>
              <option value="5">5 Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

interface DocumentsTabProps {
  caseData: Case
  isActive: boolean
  onUploadFiles: (files: FileList) => void
  onPreviewDoc: (doc: { url: string; title: string }) => void
  onDeleteBankForm?: (formId: number) => void
}

function DocumentsTab({ caseData, isActive, onUploadFiles, onPreviewDoc, onDeleteBankForm }: DocumentsTabProps) {
  return (
    <div className="space-y-2">
      {isActive && (
        <div className="mb-4">
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border-2 border-dashed border-blue-200 dark:border-blue-800">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Upload Bank Forms</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  onUploadFiles(e.target.files)
                  e.target.value = ''
                }
              }}
            />
          </label>
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Name files as:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span>• opening.pdf</span>
              <span>• fts.pdf</span>
              <span>• kfs.pdf</span>
              <span>• undertaking.pdf</span>
              <span>• checklist.pdf</span>
            </div>
          </div>
        </div>
      )}

      <DocumentList
        documents={caseData.bankForms as DocumentItem[]}
        labels={BANK_FORM_LABELS}
        onPreview={(doc) => {
          if (doc.fileUrl) {
            onPreviewDoc({ url: doc.fileUrl, title: BANK_FORM_LABELS[doc.type as BankFormType] || doc.type })
          }
        }}
        onDelete={onDeleteBankForm}
      />
    </div>
  )
}

interface ActivityTabProps {
  caseData: Case
}

function ActivityTab({ caseData }: ActivityTabProps) {
  type ActivityItem = {
    type: 'stage' | 'note' | 'call'
    timestamp: Date
    data: {
      id?: number
      fromStage?: CaseStage
      toStage?: CaseStage
      notes?: string
      content?: string
      outcome?: string
    }
  }

  // Derived: combine and sort activities
  const activities: ActivityItem[] = [
    ...caseData.stageChanges.map((change) => ({
      type: 'stage' as const,
      timestamp: new Date(change.timestamp),
      data: {
        id: change.id,
        fromStage: change.fromStage as CaseStage | undefined,
        toStage: change.toStage as CaseStage,
        notes: change.notes,
      },
    })),
    ...caseData.notes.map((note) => ({
      type: 'note' as const,
      timestamp: new Date(note.timestamp),
      data: { id: note.id, content: note.content },
    })),
    ...caseData.callLogs.map((log) => ({
      type: 'call' as const,
      timestamp: new Date(log.timestamp),
      data: { id: log.id, outcome: log.outcome, notes: log.notes },
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-slate-400 dark:text-slate-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={`${activity.type}-${index}`} className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {activity.type === 'stage' && <GitCommit className="w-4 h-4 text-blue-500" />}
            {activity.type === 'note' && <FileText className="w-4 h-4 text-slate-400" />}
            {activity.type === 'call' && <Phone className="w-4 h-4 text-green-500" />}
          </div>

          <div className="flex-1 min-w-0">
            {activity.type === 'stage' && (
              <>
                <p className="text-sm text-slate-900 dark:text-white">
                  {activity.data.fromStage ? (
                    <>
                      Stage changed from{' '}
                      <span className="font-medium">{STAGE_LABELS[activity.data.fromStage]}</span>
                      {' → '}
                      <span className="font-medium">{STAGE_LABELS[activity.data.toStage!]}</span>
                    </>
                  ) : (
                    <>Converted from client</>
                  )}
                </p>
                {!activity.data.fromStage && activity.data.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activity.data.notes}
                  </p>
                )}
              </>
            )}

            {activity.type === 'note' && (
              <p className="text-sm text-slate-900 dark:text-white">{activity.data.content}</p>
            )}

            {activity.type === 'call' && (
              <>
                <p className="text-sm text-slate-900 dark:text-white">
                  Call - <span className="capitalize">{activity.data.outcome}</span>
                </p>
                {activity.data.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activity.data.notes}
                  </p>
                )}
              </>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface DocumentPreviewProps {
  url: string
  title: string
  onClose: () => void
}

function DocumentPreview({ url, title, onClose }: DocumentPreviewProps) {
  const isPdf = url.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-[420px] bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900">
          {isPdf ? (
            <iframe src={url} className="w-full h-full" title={title} />
          ) : (
            <div className="flex items-center justify-center p-4 h-full">
              <img src={url} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
