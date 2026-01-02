import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import type { Lead, CallOutcome } from '@/types/leads'
import { SidePanel, SidePanelTabs, SidePanelContent, SidePanelStatus } from '@/components/ui/SidePanel'
import { EntityActions } from '@/components/shared'
import { ActivityView } from '@/components/ui/ActivityView'
import { SectionHeader } from '@/components/ui/InfoBox'
import { WhatsAppChat } from '@/components/whatsapp/WhatsAppChat'

interface LeadSidePanelProps {
  lead?: Lead
  isOpen: boolean
  initialTab?: 'profile' | 'activity'
  onClose: () => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onDropLead: (notes?: string) => void
  onConvertLead: (notes?: string) => void
  onUpdateLead?: (updates: Partial<Lead>) => void
  onAddNote?: (content: string) => void
  onGoToClient?: (clientId: number) => void
}

type ViewMode = 'profile' | 'whatsapp' | 'activity'

export function LeadSidePanel({
  lead,
  isOpen,
  initialTab = 'profile',
  onClose,
  onLogCall,
  onDropLead,
  onConvertLead,
  onUpdateLead,
  onAddNote,
  onGoToClient,
}: LeadSidePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})

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
    }
  }, [isOpen])

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

  if (!lead) return null

  const isTerminal = lead.status === 'dropped'
  const isActioned = lead.status === 'converted'

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'whatsapp', label: 'WhatsApp', color: 'emerald' as const },
    { id: 'activity', label: 'Activity' },
  ]

  const fullName = `${lead.firstName} ${lead.lastName}`

  // Header actions - using shared EntityActions component
  // Same component is used for row actions and panel header (Rule: Row actions = Panel actions)
  const headerActions = (
    <EntityActions
      entityType="lead"
      phone={lead.phone}
      isTerminal={isTerminal}
      isActioned={isActioned}
      convertedClientId={lead.convertedClientId}
      onAddNote={(content) => onAddNote?.(content)}
      onLogCall={onLogCall}
      onGoToClient={onGoToClient}
      onConvert={onConvertLead}
      onDrop={onDropLead}
      onViewModeChange={(mode) => setViewMode(mode)}
    />
  )

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={fullName} headerActions={headerActions}>
      <SidePanelTabs
        tabs={tabs}
        activeTab={viewMode}
        onTabChange={(id) => setViewMode(id as ViewMode)}
      />

      {/* WhatsApp View */}
      {viewMode === 'whatsapp' && (
        <WhatsAppChat entityType="lead" entityId={lead.id} phone={lead.phone} />
      )}

      {/* Activity View */}
      {viewMode === 'activity' && (
        <ActivityView
          entityType="lead"
          createdAt={lead.createdAt}
          notes={lead.notes || []}
          callLogs={(lead.callLogs || []).map(c => ({
            id: c.id,
            outcome: c.outcome as 'connected' | 'noAnswer' | 'busy' | 'wrongNumber' | 'switchedOff',
            timestamp: c.timestamp,
            notes: c.notes,
          }))}
          statusChanges={(lead.statusChanges || []).map(sc => ({
            id: sc.id,
            type: sc.type as 'converted_to_client' | 'dropped',
            timestamp: sc.timestamp,
            notes: sc.notes,
          }))}
        />
      )}

      {/* Profile View */}
      {viewMode === 'profile' && (
        <>
          <SidePanelContent className="space-y-6">
            {/* Contact Section */}
            <div className="relative">
              <SectionHeader>Contact</SectionHeader>
              {/* Edit icon - absolute positioned at top right */}
              {!isEditing && !isTerminal && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-0 right-0 p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('firstName')}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{lead.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('lastName')}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{lead.lastName}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={getFieldValue('email') || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{lead.email || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={getFieldValue('phone')}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{lead.phone}</p>
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
                  className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700">"{lead.intent}"</p>
              )}
            </div>

            {/* Source Section */}
            <div>
              <SectionHeader>Source</SectionHeader>
              <p className="text-sm text-slate-700">{lead.sourceDisplay || '—'}</p>
            </div>

            {/* Transcript Section (for AskRivo leads) */}
            {lead.transcript && (
              <div>
                <SectionHeader>Transcript</SectionHeader>
                <div className="bg-slate-50 rounded-lg p-3">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">{lead.transcript}</pre>
                </div>
              </div>
            )}
          </SidePanelContent>

          {/* Save/Cancel Footer when editing */}
          {isEditing && (
            <div className="flex-shrink-0 px-6 py-4 bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedLead({})
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Not Eligible status only - converted leads don't show status bar */}
          {isTerminal && !isEditing && (
            <SidePanelStatus status="danger">
              Not Eligible
            </SidePanelStatus>
          )}
        </>
      )}
    </SidePanel>
  )
}
