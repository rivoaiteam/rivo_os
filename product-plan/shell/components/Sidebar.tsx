import {
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

interface SidebarProps {
  workspaceItems: NavigationItem[]
  toolboxItems: NavigationItem[]
  showSettings?: boolean
  settingsActive?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onNavigate?: (href: string) => void
  onSettingsClick?: () => void
}

export function Sidebar({
  workspaceItems,
  toolboxItems,
  showSettings = true,
  settingsActive,
  collapsed = false,
  onCollapsedChange,
  onNavigate,
  onSettingsClick,
}: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Workspace section */}
      <div className="flex-1 py-4 overflow-y-auto">
        <NavGroup
          label="Workspace"
          items={workspaceItems}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <div className="my-4 mx-3 border-t border-slate-200 dark:border-slate-700" />

        <NavGroup
          label="Toolbox"
          items={toolboxItems}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {/* Settings at bottom */}
      {showSettings && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-2">
          <button
            onClick={onSettingsClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${collapsed ? 'justify-center' : ''}
              ${
                settingsActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }
            `}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-2">
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
            text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

interface NavGroupProps {
  label: string
  items: NavigationItem[]
  collapsed: boolean
  onNavigate?: (href: string) => void
}

function NavGroup({ label, items, collapsed, onNavigate }: NavGroupProps) {
  return (
    <div className="px-2">
      {!collapsed && (
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${collapsed ? 'justify-center' : ''}
              ${
                item.isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }
            `}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

// Default icons for common navigation items