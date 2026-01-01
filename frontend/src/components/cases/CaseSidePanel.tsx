/**
 * Case Side Panel - Unified Entry Point
 *
 * This component delegates to:
 * - CaseCreatePanel for creating new cases
 * - CaseViewPanel for viewing/editing existing cases
 *
 * Maintained for backwards compatibility with existing imports.
 */

import type { Case, CallOutcome, BankFormType, CreateCaseData } from '@/types/cases'
import { CaseCreatePanel } from './CaseCreatePanel'
import { CaseViewPanel } from './CaseViewPanel'

interface ClientForCase {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone: string
  loanAmount?: number
  estimatedPropertyValue?: number
}

interface BankInfo {
  name: string
  icon?: string
}

// Props for create mode
interface CreateModeProps {
  mode: 'create'
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateCaseData) => void
  clients?: ClientForCase[]
  banks?: BankInfo[]
  onViewClient?: (clientId: number, fromPanel: 'case' | 'create') => void
}

// Props for view mode
interface ViewModeProps {
  mode: 'view'
  isOpen?: boolean
  caseData: Case
  onClose: () => void
  onAddNote: (content: string) => void
  onLogCall: (outcome: CallOutcome, notes?: string) => void
  onAdvanceStage: (notes?: string) => void
  onDecline: (reason: string) => void
  onWithdraw: (reason: string) => void
  onUploadBankForm: (type: BankFormType, file: File) => void
  onDeleteBankForm?: (formId: number) => void
  onUpdate?: (data: Partial<Case>) => void
  onViewClient?: (clientId: number, fromPanel: 'case' | 'create') => void
  initialTab?: 'case' | 'documents' | 'activity'
  banks?: BankInfo[]
}

type CaseSidePanelProps = CreateModeProps | ViewModeProps

export function CaseSidePanel(props: CaseSidePanelProps) {
  if (props.mode === 'create') {
    return (
      <CaseCreatePanel
        isOpen={props.isOpen}
        onClose={props.onClose}
        onCreate={props.onCreate}
        clients={props.clients}
        banks={props.banks}
        onViewClient={props.onViewClient ? (id) => props.onViewClient!(id, 'create') : undefined}
      />
    )
  }

  return (
    <CaseViewPanel
      isOpen={props.isOpen}
      caseData={props.caseData}
      onClose={props.onClose}
      onAddNote={props.onAddNote}
      onLogCall={props.onLogCall}
      onAdvanceStage={props.onAdvanceStage}
      onDecline={props.onDecline}
      onWithdraw={props.onWithdraw}
      onUploadBankForm={props.onUploadBankForm}
      onDeleteBankForm={props.onDeleteBankForm}
      onUpdate={props.onUpdate}
      onViewClient={props.onViewClient ? (id) => props.onViewClient!(id, 'case') : undefined}
      initialTab={props.initialTab}
      banks={props.banks}
    />
  )
}
