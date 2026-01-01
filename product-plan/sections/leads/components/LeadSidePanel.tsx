import { useState, useEffect, useRef } from 'react'
import { Phone, Check, Edit3, Save, StickyNote, MoreHorizontal } from 'lucide-react'
import type { Lead } from '@/../product/sections/leads/types'
import { SidePanel, SidePanelTabs, SidePanelContent, SidePanelStatus } from '@/components/SidePanel'
import { ActivityView } from '@/components/ActivityView'
import { SectionHeader } from '@/components/InfoBox'
import { ActionPopover } from '@/components/ActionPopover'
import type { CallOutcome } from '@/components/ActionPopover'

interface LeadSidePanelProps {
  lead?: Lead
  isOpen: boolean
  initialTab?: 'profile' | 'activity'
  onClose: () => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onDropLead: (notes?: string) => void
  onProceedToClient: (notes?: string) => void
  onUpdateLead?: (updates: Partial<Lead>) => void
  onAddNote?: (content: string) => void
}

type ViewMode = 'profile' | 'whatsapp' | 'activity'

// Lead action options for MoreActions popover
const leadActionOptions = [
  { id: 'proceed', label: 'Convert', placeholder: 'Notes before handover?', variant: 'success' as const },
  { id: 'drop', label: 'Drop', placeholder: 'Reason for drop?', variant: 'default' as const },
]

export function LeadSidePanel({
  lead,
  isOpen,
  initialTab = 'profile',
  onClose,
  onLogCall,
  onDropLead,
  onProceedToClient,
  onUpdateLead,
  onAddNote,
}: LeadSidePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialTab)
  const [phoneCopied, setPhoneCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [notePopoverOpen, setNotePopoverOpen] = useState(false)
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)

  const noteButtonRef = useRef<HTMLButtonElement>(null)
  const phoneButtonRef = useRef<HTMLButtonElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

  const handleCopyPhone = () => {
    if (lead?.phone) {
      navigator.clipboard.writeText(lead.phone)
      setPhoneCopied(true)
      setTimeout(() => setPhoneCopied(false), 2000)
    }
  }

  // Sync viewMode with initialTab when it changes
  useEffect(() => {
    if (isOpen) {
      setViewMode(initialTab)
    }
  }, [initialTab, isOpen])

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
      setEditedLead({})
      setNotePopoverOpen(false)
      setPhoneDropdownOpen(false)
      setMoreActionsOpen(false)
    }
  }, [isOpen])

  const handleDrop = (notes?: string) => {
    onDropLead(notes)
    // Don't switch tabs for dropped - user stays on current tab
  }

  const handleSaveProfile = () => {
    if (Object.keys(editedLead).length > 0) {
      onUpdateLead?.(editedLead)
    }
    setIsEditing(false)
    setEditedLead({})
  }

  const handleFieldChange = (field: keyof Lead, value: string) => {
    setEditedLead(prev => ({ ...prev, [field]: value }))
  }

  const getFieldValue = (field: keyof Lead) => {
    if (field in editedLead) {
      return editedLead[field] as string
    }
    return lead?.[field] as string
  }

  const handlePhoneClick = () => {
    handleCopyPhone()
    setPhoneDropdownOpen(true)
  }

  if (!lead) return null

  const isActive = lead.status !== 'dropped' && lead.status !== 'converted'

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
    { id: 'activity', label: 'Activity' },
  ]

  const fullName = `${lead.firstName} ${lead.lastName}`

  // Header actions - Note and Phone always shown, More actions only for active leads
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
      {isActive ? (
        <button
          ref={moreButtonRef}
          onClick={() => setMoreActionsOpen(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-7 h-7" />
      )}
    </>
  )

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={fullName} headerActions={headerActions}>
      <SidePanelTabs
        tabs={tabs}
        activeTab={viewMode}
        onTabChange={(id) => setViewMode(id as ViewMode)}
      />

      {/* Dropdowns rendered at body level via portals */}
      <ActionPopover
        isOpen={notePopoverOpen}
        onClose={() => setNotePopoverOpen(false)}
        triggerRef={noteButtonRef as React.RefObject<HTMLButtonElement>}
        onConfirm={(_, note) => {
          if (note) {
            onAddNote?.(note)
            setViewMode('activity')
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
          setViewMode('activity')
        }}
        confirmLabel="Log Call"
      />
      <ActionPopover
        isOpen={moreActionsOpen}
        onClose={() => setMoreActionsOpen(false)}
        triggerRef={moreButtonRef as React.RefObject<HTMLButtonElement>}
        options={leadActionOptions}
        defaultOptionId="proceed"
        onConfirm={(optionId, note) => {
          if (optionId === 'proceed') {
            onProceedToClient(note)
          } else if (optionId === 'drop') {
            handleDrop(note)
          }
          setViewMode('activity')
        }}
        confirmLabel="Confirm"
      />

      {/* WhatsApp View */}
      {viewMode === 'whatsapp' && (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">yCloud Chat (embedded iframe)</p>
        </div>
      )}

      {/* Activity View */}
      {viewMode === 'activity' && (
        <ActivityView
          entityType="lead"
          createdAt={lead.createdAt}
          notes={lead.notes || []}
          callLogs={lead.callLogs.filter(c => c.outcome === 'connected' || c.outcome === 'noAnswer').map(c => ({
            id: c.id,
            outcome: c.outcome as 'connected' | 'noAnswer',
            timestamp: c.timestamp,
            notes: c.notes,
          }))}
          statusChanges={(lead.statusChanges || []).map(sc => ({
            ...sc,
            type: sc.type as 'converted_to_client' | 'converted_to_case' | 'dropped' | 'not_eligible' | 'not_proceeding',
            notes: sc.notes,
          }))}
        />
      )}

      {/* Profile View */}
      {viewMode === 'profile' && (
        <>
          <SidePanelContent className="space-y-5">
            {/* Contact Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
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
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('firstName')}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('lastName')}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.lastName}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={getFieldValue('email') || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.email || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('phone')}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Intent Section */}
            <div>
              <SectionHeader>Intent</SectionHeader>
              {isEditing ? (
                <textarea
                  value={getFieldValue('intent')}
                  onChange={(e) => handleFieldChange('intent', e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">"{lead.intent}"</p>
              )}
            </div>

            {/* Source Section */}
            <div>
              <SectionHeader>Source</SectionHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Channel</label>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{lead.channel}</p>
                </div>
                {lead.campaign && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Campaign</label>
                    <p className="text-sm text-slate-900 dark:text-white font-mono">{lead.campaign}</p>
                  </div>
                )}
              </div>
            </div>
          </SidePanelContent>

          {/* Dropped/Converted status */}
          {!isActive && (
            <SidePanelStatus
              status={lead.status === 'converted' ? 'success' : 'neutral'}
            >
              {lead.status === 'converted' ? 'Converted to Client' : 'Dropped'}
            </SidePanelStatus>
          )}
        </>
      )}
    </SidePanel>
  )
}
