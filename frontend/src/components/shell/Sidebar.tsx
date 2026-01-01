import {
  Settings,
  Menu,
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
        flex flex-col h-full bg-white
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-52'}
      `}
    >
      {/* Logo and Collapse toggle at top */}
      <div className="h-16 px-3 flex items-center gap-3">
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="p-2 rounded-lg transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Menu className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-blue-600 dark:text-blue-400">
            rivo
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        <NavGroup
          label="Workspace"
          items={workspaceItems}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <NavGroup
          label="Toolbox"
          items={toolboxItems}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {/* Settings at bottom */}
      {showSettings && (
        <div className="px-3 py-4">
          <button
            onClick={onSettingsClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              ${collapsed ? 'justify-center' : ''}
              ${
                settingsActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }
            `}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            {!collapsed && (
              <span className="text-sm">Settings</span>
            )}
          </button>
        </div>
      )}
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
    <div>
      {!collapsed && (
        <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              ${collapsed ? 'justify-center' : ''}
              ${
                item.isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }
            `}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="text-sm">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
