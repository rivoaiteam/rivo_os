import { Menu, X } from 'lucide-react'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  user?: { name: string; avatarUrl?: string }
  showMobileMenu?: boolean
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
  onLogout?: () => void
}

export function Header({
  user,
  showMobileMenu = true,
  mobileMenuOpen,
  onMobileMenuToggle,
  onLogout,
}: HeaderProps) {
  return (
    <header className="h-16 flex items-center px-6 gap-4">
      {/* Mobile menu button */}
      {showMobileMenu && (
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          )}
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* User menu */}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}
