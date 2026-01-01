import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Check,
  Clock,
  Building2,
  Edit3,
  Save,
  Eye,
  Phone,
  StickyNote,
  MoreHorizontal,
} from 'lucide-react'
import type {
  Client,
  Document,
  DocumentType,
  DocumentStatus,
  CallOutcome,
  Channel,
} from '@/../product/sections/clients/types'
import { SidePanel, SidePanelTabs, SidePanelContent, SidePanelStatus } from '@/components/SidePanel'
import { ActivityView } from '@/components/ActivityView'
import { InfoBox, SectionHeader } from '@/components/InfoBox'
import { ActionPopover } from '@/components/ActionPopover'

interface ClientSidePanelProps {
  client?: Client
  isOpen: boolean
  isCreateMode?: boolean
  initialTab?: 'profile' | 'activity'
  onClose: () => void
  onUpdateClient: (updates: Partial<Client>) => void
  onUploadDocument: (docType: DocumentType, file: File) => void
  onRequestDocuments: (docTypes: DocumentType[]) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onAddNote?: (content: string) => void
  onSendMessage: (content: string) => void
  onCreateCase: (notes?: string) => void
  onMarkNotProceeding: (notes?: string) => void
  onMarkNotEligible: (notes?: string) => void
  onCreateClient?: (client: Omit<Client, 'id' | 'createdAt' | 'documents' | 'callLogs' | 'messages' | 'eligibilityStatus' | 'estimatedDBR' | 'estimatedLTV' | 'maxLoanAmount' | 'eligibleBanks'>) => void
}

type TabView = 'profile' | 'documents' | 'whatsapp' | 'activity'

// Client action options for MoreActions popover
const clientActionOptions = [
  { id: 'convert', label: 'Convert', placeholder: 'Notes before handover?', variant: 'success' as const },
  { id: 'notEligible', label: 'Not Eligible', placeholder: 'Reason for not eligible?', variant: 'danger' as const },
  { id: 'notProceeding', label: 'Not Proceeding', placeholder: 'Reason for not proceeding?', variant: 'danger' as const },
]

// Identity documents
const identityDocs: DocumentType[] = ['passport', 'emiratesId', 'visa']

// Financial documents
const financialDocs: DocumentType[] = ['salaryCertificate', 'payslips', 'bankStatements', 'creditCardStatement', 'loanStatements']

const documentLabels: Record<DocumentType, string> = {
  passport: 'Passport',
  emiratesId: 'Emirates ID',
  visa: 'Visa',
  salaryCertificate: 'Salary Certificate',
  payslips: 'Payslips (6 months)',
  bankStatements: 'Bank Statements (6 months)',
  creditCardStatement: 'Credit Card Statement',
  loanStatements: 'Loan Statements',
}

const documentStatusConfig: Record<DocumentStatus, { icon: React.ReactNode; text: string; color: string }> = {
  missing: { icon: <Clock className="w-4 h-4" strokeWidth={1.5} />, text: 'Missing', color: 'text-slate-400' },
  uploaded: { icon: <Check className="w-4 h-4" strokeWidth={1.5} />, text: 'Uploaded', color: 'text-blue-500' },
  verified: { icon: <Check className="w-4 h-4" strokeWidth={1.5} />, text: 'Verified', color: 'text-emerald-500' },
  notApplicable: { icon: <span className="text-xs">N/A</span>, text: 'Not Applicable', color: 'text-slate-300' },
}

// Direct channels (without campaigns) - for creating clients directly
const directChannelOptions: { value: Channel; label: string }[] = [
  { value: 'AskRivo', label: 'AskRivo' },
  { value: 'PartnerDSA', label: 'Partner DSA' },
  { value: 'RMA', label: 'RMA' },
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

export function ClientSidePanel({
  client,
  isOpen,
  isCreateMode,
  initialTab = 'profile',
  onClose,
  onUpdateClient,
  onUploadDocument,
  onLogCall,
  onAddNote,
  onCreateCase,
  onMarkNotProceeding,
  onMarkNotEligible,
  onCreateClient,
}: ClientSidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabView>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState<Partial<Client>>({})
  const [newClient, setNewClient] = useState<Partial<Client>>({})
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
      setEditedClient({})
      setNewClient({})
      setPhoneCopied(false)
      setNotePopoverOpen(false)
      setPhoneDropdownOpen(false)
      setMoreActionsOpen(false)
    }
  }, [isOpen])

  // Initialize edited client when client changes
  useEffect(() => {
    if (client) {
      setEditedClient({})
    }
  }, [client?.id])

  // Handle create mode
  if (isCreateMode) {
    const handleNewFieldChange = (field: keyof Client, value: string | number | null) => {
      setNewClient(prev => ({ ...prev, [field]: value }))
    }

    const handleSourceChannelChange = (channel: string) => {
      setNewClient(prev => ({
        ...prev,
        source: { ...prev.source, channel: channel as Channel },
      }))
    }

    const handleCreateClient = () => {
      if (newClient.firstName && newClient.phone) {
        onCreateClient?.({
          firstName: newClient.firstName || '',
          lastName: newClient.lastName || '',
          email: newClient.email || '',
          phone: newClient.phone || '',
          residencyStatus: (newClient.residencyStatus as 'citizen' | 'resident') || 'resident',
          dateOfBirth: newClient.dateOfBirth || '',
          nationality: newClient.nationality || '',
          employmentStatus: (newClient.employmentStatus as 'employed' | 'selfEmployed') || 'employed',
          monthlySalary: newClient.monthlySalary || 0,
          monthlyLiabilities: newClient.monthlyLiabilities || null,
          loanAmount: newClient.loanAmount || null,
          estimatedPropertyValue: newClient.estimatedPropertyValue || null,
          source: { channel: (newClient.source?.channel as Channel) || 'RMA' },
        })
        onClose()
      }
    }

    return (
      <SidePanel isOpen={isOpen} onClose={onClose} title="New Client">
        <SidePanelContent className="space-y-5">
          {/* Identity Section */}
          <div>
            <SectionHeader>Identity</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="First Name"
                value={newClient.firstName || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('firstName', v)}
              />
              <EditableField
                label="Last Name"
                value={newClient.lastName || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('lastName', v)}
              />
              <EditableField
                label="Email"
                value={newClient.email || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('email', v)}
                span={2}
              />
              <EditableField
                label="Phone"
                value={newClient.phone || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('phone', v)}
              />
              <EditableField
                label="Date of Birth"
                value={newClient.dateOfBirth || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('dateOfBirth', v)}
              />
              <EditableField
                label="Nationality"
                value={newClient.nationality || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('nationality', v)}
              />
              <EditableSelect
                label="Residency"
                value={newClient.residencyStatus || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('residencyStatus', v)}
                options={[
                  { value: 'citizen', label: 'UAE Citizen' },
                  { value: 'resident', label: 'Resident' },
                ]}
              />
              <EditableSelect
                label="Employment"
                value={newClient.employmentStatus || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('employmentStatus', v)}
                options={[
                  { value: 'employed', label: 'Employed' },
                  { value: 'selfEmployed', label: 'Self-Employed' },
                ]}
              />
            </div>
          </div>

          {/* Financials Section */}
          <div>
            <SectionHeader>Financials</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableField
                label="Monthly Salary"
                value={newClient.monthlySalary || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('monthlySalary', v ? parseInt(v) : null)}
                type="currency"
              />
              <EditableField
                label="Monthly Liabilities"
                value={newClient.monthlyLiabilities || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('monthlyLiabilities', v ? parseInt(v) : null)}
                type="currency"
              />
              <EditableField
                label="Loan Amount"
                value={newClient.loanAmount || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('loanAmount', v ? parseInt(v) : null)}
                type="currency"
              />
              <EditableField
                label="Estimated Property Value"
                value={newClient.estimatedPropertyValue || ''}
                isEditing={true}
                onChange={(v) => handleNewFieldChange('estimatedPropertyValue', v ? parseInt(v) : null)}
                type="currency"
              />
            </div>
          </div>

          {/* Source Section */}
          <div>
            <SectionHeader>Source</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <EditableSelect
                label="Channel"
                value={newClient.source?.channel || ''}
                isEditing={true}
                onChange={handleSourceChannelChange}
                options={directChannelOptions}
              />
            </div>
          </div>
        </SidePanelContent>

        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleCreateClient}
            disabled={!newClient.firstName || !newClient.phone}
            className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
              newClient.firstName && newClient.phone
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-slate-400 bg-slate-100 dark:bg-slate-700 cursor-not-allowed'
            }`}
          >
            Create Client
          </button>
        </div>
      </SidePanel>
    )
  }

  if (!client) return null

  const missingDocs = client.documents.filter(d => d.status === 'missing')
  const isNotActive = client.status === 'converted' || client.status === 'notProceeding' || client.status === 'notEligible'

  const handleSaveProfile = () => {
    if (Object.keys(editedClient).length > 0) {
      onUpdateClient(editedClient)
    }
    setIsEditing(false)
    setEditedClient({})
  }

  const handleFieldChange = (field: keyof Client, value: string | number | null) => {
    setEditedClient(prev => ({ ...prev, [field]: value }))
  }

  const getFieldValue = (field: keyof Client) => {
    if (field in editedClient) {
      return editedClient[field]
    }
    return client[field]
  }

  // Get identity and financial documents
  const identityDocuments = client.documents.filter(d => identityDocs.includes(d.type))
  const financialDocuments = client.documents.filter(d => financialDocs.includes(d.type))

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'documents', label: 'Documents', badge: missingDocs.length },
    { id: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
    { id: 'activity', label: 'Activity' },
  ]

  const fullName = `${client.firstName} ${client.lastName}`

  // Header actions - Note and Phone always shown, More only for active clients
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
      {isNotActive ? (
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

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={fullName} headerActions={headerActions}>
      <SidePanelTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabView)}
      />

      {/* Dropdowns rendered at body level via portals */}
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
        options={clientActionOptions}
        defaultOptionId="convert"
        onConfirm={(optionId, note) => {
          if (optionId === 'convert') {
            onCreateCase(note)
          } else if (optionId === 'notEligible') {
            onMarkNotEligible(note)
          } else if (optionId === 'notProceeding') {
            onMarkNotProceeding(note)
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
          entityType="client"
          createdAt={client.createdAt}
          notes={client.notes || []}
          callLogs={client.callLogs.filter(c => c.outcome === 'connected' || c.outcome === 'noAnswer').map(c => ({
            id: c.id,
            outcome: c.outcome as 'connected' | 'noAnswer',
            timestamp: c.timestamp,
            notes: c.notes,
          }))}
          statusChanges={(client.statusChanges || []).map(sc => ({
            ...sc,
            type: sc.type as 'converted_to_client' | 'converted_to_case' | 'dropped' | 'not_eligible' | 'not_proceeding',
            notes: sc.notes,
          }))}
        />
      )}

      {/* Documents View */}
      {activeTab === 'documents' && (
        <SidePanelContent className="space-y-6">
          {/* Identity Documents */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Identity
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {identityDocuments.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onUpload={(file) => onUploadDocument(doc.type, file)}
                />
              ))}
            </div>
          </div>

          {/* Financial Documents */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Financial
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {financialDocuments.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onUpload={(file) => onUploadDocument(doc.type, file)}
                />
              ))}
            </div>
          </div>
        </SidePanelContent>
      )}

      {/* Profile View */}
      {activeTab === 'profile' && (
        <>
          <SidePanelContent className="space-y-5">
            {/* Identity Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Identity
                </h3>
                {isEditing ? (
                  <button
                    onClick={handleSaveProfile}
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
                <EditableField
                  label="First Name"
                  value={getFieldValue('firstName') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('firstName', v)}
                />
                <EditableField
                  label="Last Name"
                  value={getFieldValue('lastName') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('lastName', v)}
                />
                <EditableField
                  label="Email"
                  value={getFieldValue('email') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('email', v)}
                  span={2}
                />
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('phone') as string || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{client.phone}</p>
                  )}
                </div>
                <EditableField
                  label="Date of Birth"
                  value={getFieldValue('dateOfBirth') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('dateOfBirth', v)}
                />
                <EditableField
                  label="Nationality"
                  value={getFieldValue('nationality') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('nationality', v)}
                />
                <EditableSelect
                  label="Residency"
                  value={getFieldValue('residencyStatus') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('residencyStatus', v)}
                  options={[
                    { value: 'citizen', label: 'UAE Citizen' },
                    { value: 'resident', label: 'Resident' },
                  ]}
                />
                <EditableSelect
                  label="Employment"
                  value={getFieldValue('employmentStatus') as string}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('employmentStatus', v)}
                  options={[
                    { value: 'salaried', label: 'Salaried' },
                    { value: 'selfEmployed', label: 'Self-Employed' },
                  ]}
                />
              </div>
            </div>

            {/* Financials Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Financials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Monthly Salary"
                  value={getFieldValue('monthlySalary') as number | null}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('monthlySalary', v ? parseInt(v) : null)}
                  type="currency"
                />
                <EditableField
                  label="Monthly Liabilities"
                  value={getFieldValue('monthlyLiabilities') as number | null}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('monthlyLiabilities', v ? parseInt(v) : null)}
                  type="currency"
                />
                <EditableField
                  label="Loan Amount"
                  value={getFieldValue('loanAmount') as number | null}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('loanAmount', v ? parseInt(v) : null)}
                  type="currency"
                />
                <EditableField
                  label="Estimated Property Value"
                  value={getFieldValue('estimatedPropertyValue') as number | null}
                  isEditing={isEditing}
                  onChange={(v) => handleFieldChange('estimatedPropertyValue', v ? parseInt(v) : null)}
                  type="currency"
                />
              </div>
            </div>

            {/* Eligibility Section (Read-only) */}
            <div>
              <SectionHeader>Eligibility</SectionHeader>
              {client.eligibilityStatus === 'pending' ? (
                <InfoBox variant="warning">Financials not entered</InfoBox>
              ) : (
                <div className="space-y-3">
                  {/* DBR Progress Bar */}
                  {client.estimatedDBR !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Estimated DBR</span>
                        <span className={`text-sm font-medium ${
                          client.estimatedDBR <= 50 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {client.estimatedDBR}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${
                        client.estimatedDBR <= 50 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                      }`}>
                        <div
                          className={`h-full rounded-full ${client.estimatedDBR <= 50 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                          style={{ width: `${Math.min(client.estimatedDBR, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* LTV Progress Bar */}
                  {client.estimatedLTV !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Estimated LTV</span>
                        <span className={`text-sm font-medium ${
                          client.estimatedLTV <= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {client.estimatedLTV}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${
                        client.estimatedLTV <= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                      }`}>
                        <div
                          className={`h-full rounded-full ${client.estimatedLTV <= 80 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`}
                          style={{ width: `${Math.min(client.estimatedLTV, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Max Loan Amount */}
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Max Loan Amount
                    </label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatCurrency(client.maxLoanAmount) || '—'}
                    </p>
                  </div>
                  {/* Eligible Banks */}
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Eligible Banks
                    </label>
                    {client.eligibleBanks && client.eligibleBanks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {client.eligibleBanks.map((bank) => (
                          <span
                            key={bank}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded"
                          >
                            <Building2 className="w-3 h-3" strokeWidth={1.5} />
                            {bank}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">No eligible banks</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Source Section */}
            <div>
              <SectionHeader>Source</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Channel</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{client.source.channel}</p>
                </div>
                {client.source.campaign && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Campaign</label>
                    <p className="text-sm text-slate-900 dark:text-white font-mono">{client.source.campaign}</p>
                  </div>
                )}
              </div>
            </div>
          </SidePanelContent>

          {/* Converted/Not Active status */}
          {isNotActive && (
            <SidePanelStatus
              status={client.status === 'converted' ? 'success' : 'neutral'}
            >
              {client.status === 'converted'
                ? 'Converted to Case'
                : client.status === 'notProceeding'
                  ? 'Not Proceeding'
                  : 'Not Eligible'}
            </SidePanelStatus>
          )}
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
    ? formatCurrency(typeof value === 'string' ? parseInt(value) : value)
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

interface DocumentRowProps {
  document: Document
  onUpload: (file: File) => void
}

function DocumentRow({ document, onUpload }: DocumentRowProps) {
  const config = documentStatusConfig[document.status]
  const isActionable = document.status === 'missing'

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
    <div className={`
      flex items-center justify-between py-2
      ${document.status === 'notApplicable' ? 'opacity-50' : ''}
    `}>
      <div className="flex items-center gap-2.5">
        <span className={config.color}>
          {config.icon}
        </span>
        <span className={`text-sm ${
          document.status === 'uploaded' || document.status === 'verified'
            ? 'text-slate-900 dark:text-white'
            : 'text-slate-600 dark:text-slate-300'
        }`}>
          {documentLabels[document.type]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {document.status === 'uploaded' || document.status === 'verified' ? (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {document.uploadedAt && formatRelativeTime(document.uploadedAt)}
            </span>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
              title="View document"
            >
              <Eye className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </>
        ) : null}

        {isActionable ? (
          <button
            onClick={handleFileSelect}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Upload
          </button>
        ) : null}
      </div>
    </div>
  )
}
