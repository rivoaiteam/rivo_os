/**
 * Client Side Panel - Unified Entry Point
 *
 * This component delegates to:
 * - ClientCreatePanel for creating new clients
 * - ClientViewPanel for viewing/editing existing clients
 *
 * Maintained for backwards compatibility with existing imports.
 */

import type { Client, CallOutcome, DocumentType } from '@/types/clients'
import { ClientCreatePanel, type ClientFormData } from './ClientCreatePanel'
import { ClientViewPanel } from './ClientViewPanel'

interface CaseReference {
  id: number
  caseId: string
  stage: string
}

// Props for create mode
interface CreateModeProps {
  mode: 'create'
  isOpen: boolean
  onClose: () => void
  onCreate: (data: ClientFormData) => void
}

// Props for view mode
interface ViewModeProps {
  mode: 'view'
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
  viewOnly?: boolean
}

type ClientSidePanelProps = CreateModeProps | ViewModeProps

export function ClientSidePanel(props: ClientSidePanelProps) {
  if (props.mode === 'create') {
    return (
      <ClientCreatePanel
        isOpen={props.isOpen}
        onClose={props.onClose}
        onCreate={props.onCreate}
      />
    )
  }

  return (
    <ClientViewPanel
      isOpen={props.isOpen}
      client={props.client}
      onClose={props.onClose}
      onAddNote={props.onAddNote}
      onLogCall={props.onLogCall}
      onMarkNotProceeding={props.onMarkNotProceeding}
      onMarkNotEligible={props.onMarkNotEligible}
      onCreateCase={props.onCreateCase}
      onUploadDocument={props.onUploadDocument}
      onDeleteDocument={props.onDeleteDocument}
      onUpdate={props.onUpdate}
      onGoToCase={props.onGoToCase}
      cases={props.cases}
      initialTab={props.initialTab}
      viewOnly={props.viewOnly}
    />
  )
}
