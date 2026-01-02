/**
 * Client View Panel Component
 * Single responsibility: Viewing and editing existing clients
 */

import { useState } from 'react'
import { ExternalLink, CheckCircle, XCircle, Phone, FileText, Pencil, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Client, CallOutcome, DocumentType, ResidencyStatus, EmploymentStatus } from '@/types/clients'
import { SidePanel, SidePanelTabs, SidePanelContent, SidePanelStatus } from '@/components/ui/SidePanel'
import { EntityActions } from '@/components/shared'
import { DocumentList, type DocumentItem } from '@/components/ui/DocumentList'
import { WhatsAppChat } from '@/components/whatsapp/WhatsAppChat'

const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
  'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahraini', 'Bangladeshi',
  'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Canadian', 'Chinese', 'Colombian',
  'Croatian', 'Czech', 'Danish', 'Dutch', 'Egyptian', 'Emirati', 'Ethiopian',
  'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Hungarian', 'Indian',
  'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Japanese',
  'Jordanian', 'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Lebanese', 'Libyan',
  'Malaysian', 'Mexican', 'Moroccan', 'Nepalese', 'New Zealander', 'Nigerian',
  'Norwegian', 'Omani', 'Pakistani', 'Palestinian', 'Peruvian', 'Polish',
  'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Saudi', 'Serbian', 'Singaporean',
  'South African', 'Spanish', 'Sri Lankan', 'Sudanese', 'Swedish', 'Swiss',
  'Syrian', 'Taiwanese', 'Thai', 'Tunisian', 'Turkish', 'Ukrainian', 'Uzbek',
  'Venezuelan', 'Vietnamese', 'Yemeni', 'Other'
]

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  emiratesId: 'Emirates ID (front & back)',
  visa: 'Visa',
  salaryCertificate: 'Salary Certificate',
  payslips: 'Payslips (6 months)',
  bankStatements: 'Bank Statements (6 months)',
  creditCardStatement: 'Credit Card Statement',
  loanStatements: 'Loan Statements',
  other: 'Other Document',
}

interface CaseReference {
  id: number
  caseId: string
  stage: string
}

type ViewMode = 'profile' | 'documents' | 'whatsapp' | 'activity'

interface ClientViewPanelProps {
  isOpen?: boolean
  client: Client
  onClose: () => void
  onAddNote: (content: string) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onMarkNotProceeding: (notes?: string) => void
  onMarkNotEligible: (notes?: string) => void
  onCreateCase: () => void
  onUploadDocument: (type: DocumentType, file: File) => void
  onDeleteDocument?: (documentId: number) => void
  onUpdate?: (data: Partial<Client>) => void
  onGoToCase?: (caseId: number) => void
  cases?: CaseReference[]
  initialTab?: 'profile' | 'documents' | 'activity'
  viewOnly?: boolean  // Hide all actions when viewing from another tab
}

const INPUT_CLASSES = 'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'documents', label: 'Documents' },
  { id: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
  { id: 'activity', label: 'Activity' },
]

export function ClientViewPanel({
  isOpen = true,
  client,
  onClose,
  onAddNote,
  onLogCall,
  onMarkNotProceeding,
  onMarkNotEligible,
  onCreateCase,
  onUploadDocument,
  onDeleteDocument,
  onUpdate,
  onGoToCase,
  cases = [],
  initialTab = 'profile',
  viewOnly = false,
}: ClientViewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Client>>({})
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null)

  // Derived state
  const isTerminal = client.status !== 'active'
  const isActioned = cases.length > 0
  const fullName = `${client.firstName} ${client.lastName}`

  // Eligibility calculations (derived)
  const salary = isEditing ? (editData.monthlySalary ?? client.monthlySalary ?? 0) : (client.monthlySalary ?? 0)
  const liabilities = isEditing ? (editData.monthlyLiabilities ?? client.monthlyLiabilities ?? 0) : (client.monthlyLiabilities ?? 0)
  const loanAmount = isEditing ? (editData.loanAmount ?? client.loanAmount ?? 0) : (client.loanAmount ?? 0)
  const propertyValue = isEditing ? (editData.estimatedPropertyValue ?? client.estimatedPropertyValue ?? 0) : (client.estimatedPropertyValue ?? 0)

  const residency = isEditing ? (editData.residencyStatus ?? client.residencyStatus) : client.residencyStatus

  const dbr = salary > 0 && liabilities ? (liabilities / salary * 100) : null
  const ltv = loanAmount && propertyValue > 0 ? (loanAmount / propertyValue * 100) : null
  const maxLoan = salary > 0 ? (salary * 0.5 - liabilities) * 240 : null
  // LTV threshold: 85% for UAE Nationals (uaeNational), 80% for others
  const ltvLimit = residency === 'uaeNational' ? 85 : 80

  // Edit handlers
  const startEditing = () => {
    setEditData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      residencyStatus: client.residencyStatus,
      dateOfBirth: client.dateOfBirth,
      nationality: client.nationality,
      employmentStatus: client.employmentStatus,
      monthlySalary: client.monthlySalary,
      monthlyLiabilities: client.monthlyLiabilities,
      loanAmount: client.loanAmount,
      estimatedPropertyValue: client.estimatedPropertyValue,
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
      onClose()
    }
  }

  const updateEditField = <K extends keyof Client>(field: K, value: Client[K] | undefined) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  // Header actions
  const headerActions = (
    <EntityActions
      entityType="client"
      phone={client.phone}
      viewOnly={viewOnly}
      isTerminal={isTerminal}
      isActioned={isActioned}
      cases={cases}
      onAddNote={onAddNote}
      onLogCall={onLogCall}
      onGoToCase={onGoToCase}
      onCreateCase={onCreateCase}
      onMarkNotProceeding={onMarkNotProceeding}
      onMarkNotEligible={onMarkNotEligible}
      onViewModeChange={(mode) => setViewMode(mode)}
    />
  )

  return (
    <>
      <SidePanel isOpen={isOpen} onClose={onClose} title={fullName} headerActions={headerActions}>
        <SidePanelTabs
          tabs={TABS}
          activeTab={viewMode}
          onTabChange={(id) => setViewMode(id as ViewMode)}
        />

        {viewMode === 'whatsapp' && (
          <WhatsAppChat entityType="client" entityId={client.id} phone={client.phone} />
        )}

        {viewMode === 'documents' && (
          <DocumentsTab
            client={client}
            isTerminal={isTerminal}
            onUploadDocument={onUploadDocument}
            onPreviewDoc={setPreviewDoc}
            onDeleteDocument={onDeleteDocument}
          />
        )}

        {viewMode === 'activity' && (
          <ActivityTab client={client} />
        )}

        {viewMode === 'profile' && (
          <>
            <ProfileTab
              client={client}
              isEditing={isEditing}
              editData={editData}
              isTerminal={isTerminal}
              dbr={dbr}
              ltv={ltv}
              maxLoan={maxLoan}
              ltvLimit={ltvLimit}
              onStartEdit={startEditing}
              onUpdateField={updateEditField}
            />

            {isEditing && (
              <div className="flex-shrink-0 px-6 py-4 bg-white">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdits}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {isTerminal && !isEditing && (
              <SidePanelStatus status={client.status === 'notEligible' ? 'danger' : 'neutral'}>
                {client.status === 'notEligible' ? 'Not Eligible' : 'Withdrawn'}
              </SidePanelStatus>
            )}
          </>
        )}
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

interface ProfileTabProps {
  client: Client
  isEditing: boolean
  editData: Partial<Client>
  isTerminal: boolean
  dbr: number | null
  ltv: number | null
  maxLoan: number | null
  ltvLimit: number
  onStartEdit: () => void
  onUpdateField: <K extends keyof Client>(field: K, value: Client[K] | undefined) => void
}

function ProfileTab({ client, isEditing, editData, isTerminal, dbr, ltv, maxLoan, ltvLimit, onStartEdit, onUpdateField }: ProfileTabProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const getValue = <K extends keyof Client>(field: K): Client[K] => {
    return isEditing && field in editData ? editData[field] as Client[K] : client[field]
  }

  const handleAedChange = (field: 'monthlySalary' | 'monthlyLiabilities' | 'loanAmount' | 'estimatedPropertyValue', value: string) => {
    const num = value ? Number(value) : undefined
    if (num !== undefined && num < 0) {
      setFieldErrors(prev => ({ ...prev, [field]: 'Must be positive' }))
    } else {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
    onUpdateField(field, num)
  }

  const handleDobChange = (value: string) => {
    if (value && new Date(value) > new Date()) {
      setFieldErrors(prev => ({ ...prev, dateOfBirth: 'DOB cannot be in future' }))
    } else {
      setFieldErrors(prev => ({ ...prev, dateOfBirth: '' }))
    }
    onUpdateField('dateOfBirth', value)
  }

  return (
    <SidePanelContent className="space-y-6">
      {/* Name Fields */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={getValue('firstName') || ''}
                onChange={(e) => onUpdateField('firstName', e.target.value)}
                className={INPUT_CLASSES}
              />
            ) : (
              <p className="text-sm text-slate-900">{client.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={getValue('lastName') || ''}
                onChange={(e) => onUpdateField('lastName', e.target.value)}
                className={INPUT_CLASSES}
              />
            ) : (
              <p className="text-sm text-slate-900">{client.lastName}</p>
            )}
          </div>
        </div>
        {!isEditing && !isTerminal && (
          <button
            onClick={onStartEdit}
            className="absolute top-0 right-0 p-1 rounded hover:bg-slate-100 transition-colors"
            title="Edit Profile"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          {isEditing ? (
            <input
              type="email"
              value={getValue('email') || ''}
              onChange={(e) => onUpdateField('email', e.target.value)}
              className={INPUT_CLASSES}
            />
          ) : (
            <p className="text-sm text-slate-900">{client.email || '—'}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={getValue('phone') || ''}
              onChange={(e) => onUpdateField('phone', e.target.value)}
              className={INPUT_CLASSES}
            />
          ) : (
            <p className="text-sm text-slate-900">{client.phone}</p>
          )}
        </div>
      </div>

      {/* Source */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Source</label>
          <p className="text-sm text-slate-900">{client.sourceDisplay || '—'}</p>
        </div>
      </div>

      {/* Residency & Employment */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Residency Status</label>
          {isEditing ? (
            <select
              value={getValue('residencyStatus')}
              onChange={(e) => onUpdateField('residencyStatus', e.target.value as ResidencyStatus)}
              className={INPUT_CLASSES}
            >
              <option value="uaeNational">UAE National</option>
              <option value="uaeResident">UAE Resident</option>
              <option value="nonResident">Non-Resident</option>
            </select>
          ) : (
            <p className="text-sm text-slate-900">
              {client.residencyStatus === 'uaeNational' ? 'UAE National' :
               client.residencyStatus === 'uaeResident' ? 'UAE Resident' : 'Non-Resident'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Employment Status</label>
          {isEditing ? (
            <select
              value={getValue('employmentStatus')}
              onChange={(e) => onUpdateField('employmentStatus', e.target.value as EmploymentStatus)}
              className={INPUT_CLASSES}
            >
              <option value="salaried">Salaried</option>
              <option value="selfEmployed">Self-Employed</option>
            </select>
          ) : (
            <p className="text-sm text-slate-900">
              {client.employmentStatus === 'selfEmployed' ? 'Self-Employed' : 'Salaried'}
            </p>
          )}
        </div>
      </div>

      {/* DOB & Nationality */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
          {isEditing ? (
            <>
              <input
                type="date"
                value={getValue('dateOfBirth') || ''}
                onChange={(e) => handleDobChange(e.target.value)}
                className={INPUT_CLASSES}
              />
              {fieldErrors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{fieldErrors.dateOfBirth}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-900">{client.dateOfBirth || '—'}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Nationality</label>
          {isEditing ? (
            <select
              value={getValue('nationality') || ''}
              onChange={(e) => onUpdateField('nationality', e.target.value)}
              className={INPUT_CLASSES}
            >
              <option value="">Select</option>
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-900">{client.nationality || '—'}</p>
          )}
        </div>
      </div>

      {/* Financial Fields */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Monthly Salary (AED)</label>
          {isEditing ? (
            <>
              <input
                type="number"
                value={getValue('monthlySalary') ?? ''}
                onChange={(e) => handleAedChange('monthlySalary', e.target.value)}
                className={INPUT_CLASSES}
              />
              {fieldErrors.monthlySalary && <p className="mt-1 text-xs text-red-500">{fieldErrors.monthlySalary}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-900">
              {client.monthlySalary ? `AED ${client.monthlySalary.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Monthly Liabilities (AED)</label>
          {isEditing ? (
            <>
              <input
                type="number"
                value={getValue('monthlyLiabilities') ?? ''}
                onChange={(e) => handleAedChange('monthlyLiabilities', e.target.value)}
                className={INPUT_CLASSES}
              />
              {fieldErrors.monthlyLiabilities && <p className="mt-1 text-xs text-red-500">{fieldErrors.monthlyLiabilities}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-900">
              {client.monthlyLiabilities ? `AED ${client.monthlyLiabilities.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Loan Amount (AED)</label>
          {isEditing ? (
            <>
              <input
                type="number"
                value={getValue('loanAmount') ?? ''}
                onChange={(e) => handleAedChange('loanAmount', e.target.value)}
                className={INPUT_CLASSES}
              />
              {fieldErrors.loanAmount && <p className="mt-1 text-xs text-red-500">{fieldErrors.loanAmount}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-900">
              {client.loanAmount ? `AED ${client.loanAmount.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Property Value (AED)</label>
          {isEditing ? (
            <>
              <input
                type="number"
                value={getValue('estimatedPropertyValue') ?? ''}
                onChange={(e) => handleAedChange('estimatedPropertyValue', e.target.value)}
                className={INPUT_CLASSES}
              />
              {fieldErrors.estimatedPropertyValue && <p className="mt-1 text-xs text-red-500">{fieldErrors.estimatedPropertyValue}</p>}
            </>
          ) : (
            <p className="text-sm text-slate-900">
              {client.estimatedPropertyValue ? `AED ${client.estimatedPropertyValue.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
      </div>

      {/* Eligibility Indicators */}
      {(client.monthlySalary || (isEditing && editData.monthlySalary)) && (
        <EligibilityIndicators dbr={dbr} ltv={ltv} maxLoan={maxLoan} ltvLimit={ltvLimit} />
      )}
    </SidePanelContent>
  )
}

function EligibilityIndicators({ dbr, ltv, maxLoan, ltvLimit }: { dbr: number | null; ltv: number | null; maxLoan: number | null; ltvLimit: number }) {
  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">DBR</div>
          {dbr != null ? (
            <>
              <div className={`text-sm font-semibold ${dbr > 50 ?'text-amber-600' : 'text-green-600'}`}>
                {dbr.toFixed(1)}%
              </div>

              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${dbr > 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(dbr, 100)}%` }} />
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">LTV</div>
          {ltv != null ? (
            <>
              <div className={`text-sm font-semibold ${ltv > ltvLimit ? 'text-amber-600' : 'text-green-600'}`}>
                {ltv.toFixed(1)}%
              </div>
              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${ltv > ltvLimit ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(ltv, 100)}%` }} />
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">—</div>
          )}
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Max Loan</div>
          <div className="text-sm font-semibold text-slate-900">
            {maxLoan && maxLoan > 0 ? `AED ${Math.round(maxLoan).toLocaleString()}` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

interface DocumentsTabProps {
  client: Client
  isTerminal: boolean
  onUploadDocument: (type: DocumentType, file: File) => void
  onPreviewDoc: (doc: { url: string; title: string }) => void
  onDeleteDocument?: (documentId: number) => void
}

function DocumentsTab({ client, isTerminal, onUploadDocument, onPreviewDoc, onDeleteDocument }: DocumentsTabProps) {
  return (
    <SidePanelContent className="space-y-2">
      <DocumentList
        documents={client.documents as DocumentItem[]}
        labels={DOCUMENT_LABELS}
        onPreview={(doc) => {
          if (doc.fileUrl) {
            onPreviewDoc({ url: doc.fileUrl, title: DOCUMENT_LABELS[doc.type as DocumentType] || doc.type })
          }
        }}
        onDelete={onDeleteDocument}
        onUpload={(type, file) => onUploadDocument(type as DocumentType, file)}
        allowUpload={!isTerminal}
      />
    </SidePanelContent>
  )
}

function ActivityTab({ client }: { client: Client }) {
  // Check if client was converted from lead (has converted_from_lead status change)
  const wasConvertedFromLead = client.statusChanges.some(sc => sc.type === 'converted_from_lead')

  // Derived: combine and sort all activities
  // Don't show "Client created" if client was converted from lead (redundant)
  const activities = [
    ...client.callLogs.map((log) => ({ type: 'call' as const, data: log, timestamp: new Date(log.timestamp) })),
    ...client.notes.map((note) => ({ type: 'note' as const, data: note, timestamp: new Date(note.timestamp) })),
    ...client.statusChanges.map((change) => ({ type: 'status' as const, data: change, timestamp: new Date(change.timestamp) })),
    // Only show "Client created" if not converted from lead
    ...(!wasConvertedFromLead ? [{ type: 'created' as const, data: { id: 0 }, timestamp: new Date(client.createdAt) }] : []),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <SidePanelContent className="space-y-4">
      {activities.map((activity, index) => (
        <div key={`${activity.type}-${index}`} className="flex gap-3">
          <div className="flex-shrink-0">
            {activity.type === 'call' && <Phone className="w-4 h-4 text-blue-500 mt-0.5" />}
            {activity.type === 'note' && <FileText className="w-4 h-4 text-slate-400 mt-0.5" />}
            {activity.type === 'status' && (
              (activity.data.type === 'converted_to_case' || activity.data.type === 'converted_from_lead')
                ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
            )}
            {activity.type === 'created' && <div className="w-4 h-4 rounded-full bg-slate-300 mt-0.5" />}
          </div>
          <div className="flex-1">
            {activity.type === 'call' && (
              <>
                <p className="text-sm text-slate-900">Call - {activity.data.outcome}</p>
                {activity.data.notes && <p className="text-xs text-slate-500 mt-1">{activity.data.notes}</p>}
              </>
            )}
            {activity.type === 'note' && <p className="text-sm text-slate-900">{activity.data.content}</p>}
            {activity.type === 'status' && (
              <>
                <p className="text-sm text-slate-900">
                  {activity.data.type === 'converted_from_lead' ? 'Converted from lead' :
                   activity.data.type === 'converted_to_case' ? 'Converted to case' :
                   activity.data.type === 'not_eligible' || activity.data.type === 'notEligible' ? 'Marked not eligible' :
                   activity.data.type === 'not_proceeding' || activity.data.type === 'notProceeding' ? 'Marked withdrawn' :
                   activity.data.type}
                </p>
                {activity.data.notes && (
                  <p className="text-xs text-slate-500 mt-1">{activity.data.notes}</p>
                )}
              </>
            )}
            {activity.type === 'created' && <p className="text-sm text-slate-900">Client created</p>}
            <p className="text-xs text-slate-400 mt-1">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </SidePanelContent>
  )
}

function DocumentPreview({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-1/2 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Open in new tab">
              <ExternalLink className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100">
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
