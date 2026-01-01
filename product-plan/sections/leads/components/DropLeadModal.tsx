import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import type { DropStatus } from '@/../product/sections/leads/types'

interface DropLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onDrop: (status: DropStatus, notes: string) => void
}

const statusOptions: { value: DropStatus; label: string }[] = [
  { value: 'dead', label: 'Dead' },
  { value: 'notInterested', label: 'Not Interested' },
]

export function DropLeadModal({ isOpen, onClose, onDrop }: DropLeadModalProps) {
  const [status, setStatus] = useState<DropStatus | ''>('')
  const [notes, setNotes] = useState('')

  const isValid = !!status

  if (!isOpen) return null

  const handleDrop = () => {
    if (!status) return
    onDrop(status, notes)
    setStatus('')
    setNotes('')
  }

  const handleClose = () => {
    setStatus('')
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
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Drop Lead
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
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Reason
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DropStatus | '')}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select reason...</option>
                {statusOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            {status && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Notes <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}
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
              onClick={handleDrop}
              disabled={!isValid}
              className={`
                px-6 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${isValid
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Drop
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
