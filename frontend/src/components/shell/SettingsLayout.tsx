import { ArrowLeft, Settings, Megaphone, FileText, Users } from 'lucide-react'

export interface SettingsSection {
  id: string
  label: string
  icon: React.ReactNode
}

export interface SettingsGroup {
  id: string
  label: string
  sections: SettingsSection[]
}

export interface SettingsLayoutProps {
  children: React.ReactNode
  activeSection?: string
  onBack?: () => void
  onSectionChange?: (sectionId: string) => void
}

// Simplified settings groups (removed Roles per user request)
const settingsGroups: SettingsGroup[] = [
  {
    id: 'sources',
    label: 'Sources',
    sections: [
      { id: 'channels', label: 'Channels', icon: <Megaphone className="w-4 h-4" /> },
      { id: 'campaigns', label: 'Campaigns', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    sections: [
      { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    ],
  },
]

export function SettingsLayout({
  children,
  activeSection,
  onBack,
  onSectionChange,
}: SettingsLayoutProps) {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        {/* Settings sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
          {/* Back button */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>

          {/* Settings header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
            </div>
          </div>

          {/* Settings navigation */}
          <nav className="p-4 space-y-6">
            {settingsGroups.map((group) => (
              <div key={group.id}>
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {group.label}
                </h2>
                <ul className="space-y-1">
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => onSectionChange?.(section.id)}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                          transition-colors duration-150
                          ${
                            activeSection === section.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }
                        `}
                      >
                        {section.icon}
                        <span>{section.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Settings content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Export the settings groups for use elsewhere
export { settingsGroups }
