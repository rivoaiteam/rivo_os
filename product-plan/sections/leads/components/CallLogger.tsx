import { useState } from 'react'
import { X, Phone } from 'lucide-react'
import type { CallOutcome } from '@/../product/sections/leads/types'

interface CallLoggerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (outcome: CallOutcome, notes: string) => void
}

const outcomeOptions: { value: CallOutcome; label: string }[] = [
  { value: 'connected', label: 'Connected' },
  { value: 'noAnswer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrongNumber', label: 'Wrong Number' },
  { value: 'switchedOff', label: 'Switched Off' },
]

export function CallLogger({ isOpen, onClose, onSave }: CallLoggerProps) {
  const [outcome, setOutcome] = useState<CallOutcome | ''>('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSave = () => {
    if (!outcome) return
    onSave(outcome, notes)
    setOutcome('')
    setNotes('')
  }

  const handleClose = () => {
    setOutcome('')
    setNotes('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Log Call
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select outcome...</option>
                {outcomeOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn?"
                rows={3}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!outcome}
              className={`
                px-6 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${outcome
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}