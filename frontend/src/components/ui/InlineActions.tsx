import { useState, useRef, useEffect, useCallback } from 'react'
import { Phone, StickyNote, MoreHorizontal, Check, Briefcase, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ClientCase, CallOutcome } from '@/types/clients'
import { STAGE_LABELS } from '@/types/cases'
import type { CaseStage } from '@/types/cases'
import { useClickOutside } from '@/hooks/useClickOutside'

interface InlineActionsProps {
  children: React.ReactNode
}

export function InlineActions({ children }: InlineActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {children}
    </div>
  )
}

interface NoteActionProps {
  onAddNote: (content: string) => void
}

export function NoteAction({ onAddNote }: NoteActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setNote('')
  }, [])

  useClickOutside(containerRef, handleClose, isOpen)

  const handleSubmit = () => {
    if (note.trim()) {
      onAddNote(note.trim())
      setNote('')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        title="Add Note"
      >
        <StickyNote className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!note.trim()}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                note.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface PhoneActionProps {
  phone: string
  onLogCall: (outcome: CallOutcome, notes?: string) => void
}

const callOutcomeOptions: { value: CallOutcome; label: string; variant: 'success' | 'default'; placeholder: string }[] = [
  { value: 'connected', label: 'Connected', variant: 'success', placeholder: 'Notes about the call?' },
  { value: 'noAnswer', label: 'No Answer', variant: 'default', placeholder: 'Notes about the attempt?' },
]

export function PhoneAction({ phone, onLogCall }: PhoneActionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('connected')
  const [notes, setNotes] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setNotes('')
  }, [])

  useClickOutside(containerRef, handleClose, isOpen)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setIsOpen(true)
  }

  const handleSubmit = () => {
    onLogCall(selectedOutcome, notes || undefined)
    setNotes('')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleClick}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        title="Log Call"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {callOutcomeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedOutcome(option.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    selectedOutcome === option.value
                      ? option.variant === 'success'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-600'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={callOutcomeOptions.find(o => o.value === selectedOutcome)?.placeholder || 'Add notes...'}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface RowAction {
  label: string
  onClick: (notes?: string) => void
  variant: 'success' | 'danger' | 'warning' | 'default'
  placeholder?: string
  required?: boolean
}

interface RowActionsDropdownProps {
  actions: RowAction[]
}

export function RowActionsDropdown({ actions }: RowActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedAction = actions[selectedIndex] || null

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSelectedIndex(0)
    setNotes('')
  }, [])

  useClickOutside(containerRef, handleClose, isOpen)

  const handleSubmit = () => {
    if (selectedAction) {
      selectedAction.onClick(notes || undefined)
      setIsOpen(false)
      setSelectedIndex(0)
      setNotes('')
    }
  }

  const getButtonClasses = (action: RowAction, isSelected: boolean) => {
    const baseClasses = 'px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors'
    if (isSelected) {
      if (action.variant === 'success') {
        return `${baseClasses} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-600`
      } else if (action.variant === 'danger') {
        return `${baseClasses} bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-600`
      } else if (action.variant === 'warning') {
        return `${baseClasses} bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-600`
      } else {
        return `${baseClasses} bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-500`
      }
    }
    return `${baseClasses} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600`
  }

  const isSubmitDisabled = !selectedAction || (selectedAction.required && !notes.trim())

  const getSubmitButtonClasses = () => {
    if (isSubmitDisabled) {
      return 'px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
    }
    const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors'
    if (selectedAction.variant === 'success') {
      return `${baseClasses} bg-emerald-600 hover:bg-emerald-700 text-white`
    } else if (selectedAction.variant === 'danger') {
      return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`
    } else if (selectedAction.variant === 'warning') {
      return `${baseClasses} bg-amber-600 hover:bg-amber-700 text-white`
    }
    return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className={`grid gap-2 ${actions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={getButtonClasses(action, selectedIndex === index)}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={selectedAction?.placeholder || 'Add notes...'}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className={getSubmitButtonClasses()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CasesDropdownProps {
  cases: ClientCase[]
  onSelectCase: (caseId: number) => void
}

export function CasesDropdown({ cases, onSelectCase }: CasesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => setIsOpen(false), [])

  useClickOutside(containerRef, handleClose, isOpen)

  if (cases.length === 0) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
        title={`${cases.length} case${cases.length > 1 ? 's' : ''}`}
      >
        <Briefcase className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelectCase(c.id)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {c.bankIcon ? (
                <img
                  src={c.bankIcon}
                  alt={c.bankName || ''}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded text-[9px] text-slate-500">
                  —
                </span>
              )}
              <div className="flex-1 text-left">
                <div className="text-sm text-slate-900 dark:text-white">
                  {c.bankName || 'No bank'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {STAGE_LABELS[c.stage as CaseStage] || c.stage}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ClientLinkProps {
  clientId: number
  onClick?: () => void  // Custom click handler to show overlay instead of navigate
}

export function ClientLink({ clientId, onClick }: ClientLinkProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (onClick) {
          onClick()
        } else {
          navigate(`/clients?id=${clientId}`)
        }
      }}
      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
      title="View Client"
    >
      <UserCheck className="w-4 h-4" />
    </button>
  )
}
