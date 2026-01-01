import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: string
  headerActions?: React.ReactNode
  children: React.ReactNode
  fullWidth?: boolean
}

export function SidePanel({ isOpen, onClose, title, subtitle, headerActions, children, fullWidth = false }: SidePanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Show immediately, then animate in
      setIsVisible(true)
      // Small delay to ensure the element is in the DOM before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      // Animate out, then hide
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 150) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-y-0 right-0 ${fullWidth ? 'w-full' : 'w-full lg:w-1/2'} bg-white border-l border-slate-200 z-40 flex flex-col shadow-xl transform transition-transform duration-150 ease-out ${
        isAnimating ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

interface TabConfig {
  id: string
  label: string
  color?: 'blue' | 'emerald' | 'slate'
}

interface SidePanelTabsProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function SidePanelTabs({ tabs, activeTab, onTabChange }: SidePanelTabsProps) {
  return (
    <div className="flex border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const colorClasses = tab.color === 'emerald'
          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
          : 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? `${colorClasses} border-b-2`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface SidePanelContentProps {
  children: React.ReactNode
  className?: string
}

export function SidePanelContent({ children, className = '' }: SidePanelContentProps) {
  return (
    <div className={`flex-1 min-h-0 overflow-auto px-6 py-2 ${className}`}>
      {children}
    </div>
  )
}

interface SidePanelStatusProps {
  status: 'success' | 'neutral' | 'danger'
  children: React.ReactNode
}

export function SidePanelStatus({ status, children }: SidePanelStatusProps) {
  const bgClasses = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    neutral: 'bg-slate-100 text-slate-600',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  }

  return (
    <div className={`px-6 py-4 ${bgClasses[status]}`}>
      <p className="text-sm font-medium text-center">{children}</p>
    </div>
  )
}
