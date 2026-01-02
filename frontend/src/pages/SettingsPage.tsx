/**
 * Settings Page with navigation to sub-pages
 */

import { Routes, Route, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ChannelsPage, ChannelDetailPage, UsersPage } from '@/components/settings'

const categories = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      {
        id: 'channels',
        title: 'Channels',
        description: 'Manage acquisition channels and sources',
        href: '/settings/channels',
      },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    items: [
      {
        id: 'users',
        title: 'Users',
        description: 'Manage team members and access',
        href: '/settings/users',
      },
    ],
  },
]

function SettingsIndex() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-8">
          Settings
        </h1>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {category.title}
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full">{children}</div>
}

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <Routes>
        <Route index element={<SettingsIndex />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="channels/:channelId" element={<ChannelDetailPage />} />
        <Route path="users" element={<UsersPage />} />
      </Routes>
    </SettingsLayout>
  )
}
