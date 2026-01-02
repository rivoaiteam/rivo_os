/**
 * EntityActions Component
 *
 * Unified action component for all entity types (Lead, Client, Case).
 * Same component is used in both row actions and panel header.
 *
 * Rule: Row actions = Panel header actions. Always identical.
 *
 * State-Based Actions:
 * - Active:   Note + Call + More (status actions)
 * - Actioned: Link + Note + Call (entity has been progressed)
 * - Terminal: Link only (or none)
 */

import type { CallOutcome } from '@/types/common'
import type { ClientCase } from '@/types/clients'
import { NoteAction, PhoneAction, RowActionsDropdown, CasesDropdown, ClientLink } from '@/components/ui/InlineActions'

export type EntityType = 'lead' | 'client' | 'case'

// Action configuration for the More dropdown
export interface StatusAction {
  label: string
  status: string
  variant: 'success' | 'danger' | 'warning' | 'default'
  placeholder?: string
  required?: boolean
}

// Common props for all entities
interface BaseEntityActionsProps {
  entityType: EntityType
  phone: string
  viewOnly?: boolean  // Hide all actions when viewing from another tab
  onAddNote: (content: string) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onViewModeChange?: (mode: 'activity') => void
}

// Lead-specific props
interface LeadActionsProps extends BaseEntityActionsProps {
  entityType: 'lead'
  isTerminal: boolean  // status === 'dropped'
  isActioned: boolean  // status === 'converted'
  convertedClientId?: number
  onGoToClient?: (clientId: number) => void
  onConvert: (notes?: string) => void
  onDrop: (notes?: string) => void
}

// Client-specific props
interface ClientActionsProps extends BaseEntityActionsProps {
  entityType: 'client'
  isTerminal: boolean  // status in ['notEligible', 'notProceeding'] (withdrawn/not eligible)
  isActioned: boolean  // cases.length > 0
  cases: ClientCase[]
  onGoToCase?: (caseId: number) => void
  onCreateCase: () => void
  onMarkNotProceeding: (notes?: string) => void
  onMarkNotEligible: (notes?: string) => void
}

// Case-specific props
interface CaseActionsProps extends BaseEntityActionsProps {
  entityType: 'case'
  isTerminal: boolean  // stage in ['disbursed', 'declined', 'withdrawn']
  clientId: number
  nextStageLabel?: string  // Label for the next stage (e.g., "Submitted", "Under Review")
  onGoToClient?: (clientId: number) => void
  onAdvanceStage: (notes?: string) => void
  onDecline: (reason?: string) => void
  onWithdraw: (reason?: string) => void
}

export type EntityActionsProps = LeadActionsProps | ClientActionsProps | CaseActionsProps

/**
 * EntityActions Component
 *
 * Renders actions based on entity state:
 * - Active: Note + Call + More
 * - Actioned: Link + Note + Call
 * - Terminal: Link only
 */
export function EntityActions(props: EntityActionsProps) {
  const { entityType, phone, viewOnly, onAddNote, onLogCall, onViewModeChange } = props

  // View only mode: no actions (opened from another tab)
  if (viewOnly) return null

  const handleAddNote = (content: string) => {
    onAddNote(content)
    onViewModeChange?.('activity')
  }

  const handleLogCall = (outcome: CallOutcome, notes?: string) => {
    onLogCall(outcome, notes)
    onViewModeChange?.('activity')
  }

  // Lead actions
  if (entityType === 'lead') {
    const { isTerminal, isActioned, convertedClientId, onGoToClient, onConvert, onDrop } = props as LeadActionsProps

    // Terminal: only show client link if converted
    if (isTerminal) {
      return null
    }

    // Actioned (converted): show client link + note + call
    if (isActioned && convertedClientId) {
      return (
        <>
          <ClientLink clientId={convertedClientId} onClick={() => onGoToClient?.(convertedClientId)} />
          <NoteAction onAddNote={handleAddNote} />
          <PhoneAction phone={phone} onLogCall={handleLogCall} />
        </>
      )
    }

    // Active: show note + call + more
    return (
      <>
        <NoteAction onAddNote={handleAddNote} />
        <PhoneAction phone={phone} onLogCall={handleLogCall} />
        <RowActionsDropdown
          actions={[
            {
              label: 'Convert',
              onClick: (notes) => {
                onConvert(notes)
                onViewModeChange?.('activity')
              },
              variant: 'success',
              placeholder: 'Notes before handover?',
            },
            {
               label: 'Not Eligible',
              onClick: (notes) => {
                onDrop(notes)
                onViewModeChange?.('activity')
              },
              variant: 'danger',
              placeholder: 'Reason for not eligible?',
            },
          ]}
        />
      </>
    )
  }

  // Client actions
  if (entityType === 'client') {
    const { isTerminal, isActioned, cases, onGoToCase, onCreateCase, onMarkNotProceeding, onMarkNotEligible } = props as ClientActionsProps

    // Terminal: only show cases dropdown if has cases
    if (isTerminal) {
      if (cases.length > 0 && onGoToCase) {
        return <CasesDropdown cases={cases} onSelectCase={onGoToCase} />
      }
      return null
    }

    // Actioned (has cases): show cases + note + call
    if (isActioned && cases.length > 0) {
      return (
        <>
          {onGoToCase && <CasesDropdown cases={cases} onSelectCase={onGoToCase} />}
          <NoteAction onAddNote={handleAddNote} />
          <PhoneAction phone={phone} onLogCall={handleLogCall} />
        </>
      )
    }

    // Active: show note + call + more
    return (
      <>
        <NoteAction onAddNote={handleAddNote} />
        <PhoneAction phone={phone} onLogCall={handleLogCall} />
        <RowActionsDropdown
          actions={[
            {
              label: 'Convert',
              onClick: () => onCreateCase(),
              variant: 'success',
              placeholder: 'Notes before handover?',
            },
            {
              label: 'Withdrawn',
              onClick: (notes) => {
                onMarkNotProceeding(notes)
                onViewModeChange?.('activity')
              },
              variant: 'warning',
              placeholder: 'Reason for withdrawal?',
            },
            {
              label: 'Not Eligible',
              onClick: (notes) => {
                onMarkNotEligible(notes)
                onViewModeChange?.('activity')
              },
              variant: 'danger',
              placeholder: 'Reason for not eligible?',
            },
          ]}
        />
      </>
    )
  }

  // Case actions
  if (entityType === 'case') {
    const { isTerminal, clientId, nextStageLabel, onGoToClient, onAdvanceStage, onDecline, onWithdraw } = props as CaseActionsProps

    // Terminal: show client link only
    if (isTerminal) {
      return <ClientLink clientId={clientId} onClick={() => onGoToClient?.(clientId)} />
    }

    // Active: show client link + note + call + more
    return (
      <>
        <ClientLink clientId={clientId} onClick={() => onGoToClient?.(clientId)} />
        <NoteAction onAddNote={handleAddNote} />
        <PhoneAction phone={phone} onLogCall={handleLogCall} />
        <RowActionsDropdown
          actions={[
            {
              label: nextStageLabel || 'Advance',
              onClick: (notes) => {
                onAdvanceStage(notes)
                onViewModeChange?.('activity')
              },
              variant: 'success',
              placeholder: 'Notes for stage change?',
            },
            {
              label: 'Withdrawn',
              onClick: (reason) => {
                onWithdraw(reason)
                onViewModeChange?.('activity')
              },
              variant: 'warning',
              placeholder: 'Reason for withdrawal?',
              required: true,
            },
            {
              label: 'Decline',
              onClick: (reason) => {
                onDecline(reason)
                onViewModeChange?.('activity')
              },
              variant: 'danger',
              placeholder: 'Reason for decline?',
              required: true,
            },
          ]}
        />
      </>
    )
  }

  return null
}

// Helper to determine terminal state
export function isEntityTerminal(entityType: EntityType, status: string): boolean {
  switch (entityType) {
    case 'lead':
      return status === 'dropped'
    case 'client':
      return ['not_eligible', 'not_proceeding', 'notEligible', 'notProceeding'].includes(status)
    case 'case':
      return ['disbursed', 'declined', 'withdrawn'].includes(status)
    default:
      return false
  }
}

// Helper to determine actioned state
export function isEntityActioned(entityType: EntityType, entity: { status?: string; cases?: unknown[]; stage?: string }): boolean {
  switch (entityType) {
    case 'lead':
      return entity.status === 'converted'
    case 'client':
      return Array.isArray(entity.cases) && entity.cases.length > 0
    case 'case':
      // Cases are always "actioned" once created
      return true
    default:
      return false
  }
}
