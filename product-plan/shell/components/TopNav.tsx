import { Menu, Settings, X } from 'lucide-react'
import { UserMenu } from './UserMenu'
import type { NavigationItem } from './AppShell'

interface TopNavProps {
  workspaceItems: NavigationItem[]
  toolboxItems: NavigationItem[]
  user?: { name: string; avatarUrl?: string }
  showSettings?: boolean
  settingsActive?: boolean
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
  onNavigate?: (href: string) => void
  onSettingsClick?: () => void
  onLogout?: () => void
}

export function TopNav({
  workspaceItems,
  toolboxItems,
  user,
  showSettings = true,
  settingsActive,
  mobileMenuOpen,
  onMobileMenuToggle,
  onNavigate,
  onSettingsClick,
  onLogout,
}: TopNavProps) {
  return (
    <>
      {/* Main header */}
      <header className="sticky top-0 z-50 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="h-full px-4 flex items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              RIVO
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {/* Workspace group */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Workspace
              </span>
              <div className="flex items-center">
                {workspaceItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => onNavigate?.(item.href)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${
                        item.isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* Toolbox group */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Toolbox
              </span>
              <div className="flex items-center">
                {toolboxItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => onNavigate?.(item.href)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${
                        item.isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Settings (Manager only) */}
            {showSettings && (
              <button
                onClick={onSettingsClick}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    settingsActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* User menu */}
            <UserMenu user={user} onLogout={onLogout} />

            {/* Mobile menu button */}
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="p-4 space-y-4">
            {/* Workspace */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Workspace
              </p>
              <div className="space-y-1">
                {workspaceItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => onNavigate?.(item.href)}
                    className={`
                      w-full px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors
                      ${
                        item.isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbox */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Toolbox
              </p>
              <div className="space-y-1">
                {toolboxItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => onNavigate?.(item.href)}
                    className={`
                      w-full px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors
                      ${
                        item.isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            {showSettings && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={onSettingsClick}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors
                    ${
                      settingsActive
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}