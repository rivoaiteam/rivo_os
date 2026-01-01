import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FIXED_CHANNELS } from '@/types/settings'

export function ChannelsPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> Settings
      </button>

      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Channels</h1>
      <p className="text-sm text-slate-500 mb-6">Manage acquisition channels and their sources</p>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {FIXED_CHANNELS.map((channel) => (
          <div
            key={channel.id}
            onClick={() => navigate(`/settings/channels/${channel.id}`)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">{channel.name}</h3>
              <p className="text-xs text-slate-500">{channel.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                channel.trustLevel === 'trusted'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {channel.trustLevel === 'trusted' ? 'Trusted' : 'Untrusted'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}