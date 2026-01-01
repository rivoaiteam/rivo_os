import { useState, useRef, useCallback } from 'react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'

interface UserMenuProps {
  user?: { name: string; avatarUrl?: string }
  onLogout?: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => setOpen(false), [])

  useClickOutside(menuRef, handleClose, open)

  if (!user) {
    return null
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <User className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2} />
        )}

        {/* Name */}
        <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">
          {user.name}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50">
          <button
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  )
}
