import { useState } from 'react'
import { Header } from './Header'
import { Sidebar, type NavigationItem } from './Sidebar'

export type { NavigationItem }

export interface AppShellProps {
  children: React.ReactNode
  workspaceItems: NavigationItem[]
  toolboxItems: NavigationItem[]
  user?: { name: string; avatarUrl?: string }
  showSettings?: boolean
  settingsActive?: boolean
  onNavigate?: (href: string) => void
  onSettingsClick?: () => void
  onLogout?: () => void
  onSearch?: (query: string) => void
}

export function AppShell({
  children,
  workspaceItems,
  toolboxItems,
  user,
  showSettings = true,
  settingsActive,
  onNavigate,
  onSettingsClick,
  onLogout,
  onSearch: _onSearch = () => {},
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen flex bg-white font-['Inter',sans-serif]">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - desktop (full height) */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          workspaceItems={workspaceItems}
          toolboxItems={toolboxItems}
          showSettings={showSettings}
          settingsActive={settingsActive}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onNavigate={onNavigate}
          onSettingsClick={onSettingsClick}
        />
      </div>

      {/* Sidebar - mobile (overlay, full height) */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          workspaceItems={workspaceItems}
          toolboxItems={toolboxItems}
          showSettings={showSettings}
          settingsActive={settingsActive}
          collapsed={false}
          onNavigate={(href) => {
            onNavigate?.(href)
            setMobileMenuOpen(false)
          }}
          onSettingsClick={() => {
            onSettingsClick?.()
            setMobileMenuOpen(false)
          }}
        />
      </div>

      {/* Right side: Header + Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={onLogout}
        />

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-slate-100 m-3 mt-0 rounded-xl">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
