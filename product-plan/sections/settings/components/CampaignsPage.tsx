import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import {
  StatusBadge,
  ActionButtons,
  EditActionButtons,
  formatDate,
  EmptyState,
} from './SettingsTableElements'

export type CampaignStatus = 'incubation' | 'live' | 'pause'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  createdAt: string
}

const statusOptions = [
  {
    value: 'incubation' as const,
    label: 'Incubation',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  {
    value: 'live' as const,
    label: 'Live',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    value: 'pause' as const,
    label: 'Pause',
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
  },
]

interface CampaignsPageProps {
  campaigns: Campaign[]
  onAddCampaign?: (name: string) => void
  onEditCampaign?: (id: string, name: string) => void
  onDeleteCampaign?: (id: string) => void
  onChangeStatus?: (id: string, status: CampaignStatus) => void
}

export function CampaignsPage({
  campaigns,
  onAddCampaign,
  onEditCampaign,
  onDeleteCampaign,
  onChangeStatus,
}: CampaignsPageProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (newName.trim()) {
      onAddCampaign?.(newName.trim())
      setNewName('')
      setIsAdding(false)
    }
  }

  const handleEdit = (id: string) => {
    if (editName.trim()) {
      onEditCampaign?.(id, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  const startEdit = (campaign: Campaign) => {
    setEditingId(campaign.id)
    setEditName(campaign.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewName('')
  }

  const gridCols = 'grid-cols-4'

  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Campaigns</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage marketing campaigns for lead generation
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Campaign
            </button>
          )}
        </div>

        {/* Campaigns Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[400px]">
          {/* Table Header */}
          <div className={`grid ${gridCols} gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700`}>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Campaign Name
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Created
            </div>
            <div></div>
          </div>

          {/* Add new campaign row */}
          {isAdding && (
            <div className={`grid ${gridCols} gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 items-center`}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') cancelAdd()
                }}
                placeholder="Campaign name"
                autoFocus
                className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">Starts as Incubation</span>
              <span className="text-xs text-slate-400">Today</span>
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="p-1.5 text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 dark:disabled:text-slate-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelAdd}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Campaign rows */}
          {campaigns.length === 0 && !isAdding ? (
            <EmptyState message="No campaigns yet. Add your first campaign." />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {campaigns.map((campaign) => {
                const currentOption = statusOptions.find((opt) => opt.value === campaign.status)
                return (
                  <div
                    key={campaign.id}
                    className={`grid ${gridCols} gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors items-center`}
                  >
                    {editingId === campaign.id ? (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEdit(campaign.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${currentOption?.bg} ${currentOption?.text} w-fit`}>
                          {currentOption?.label}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(campaign.createdAt)}
                        </span>
                        <EditActionButtons
                          onSave={() => handleEdit(campaign.id)}
                          onCancel={cancelEdit}
                          disabled={!editName.trim()}
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {campaign.name}
                        </span>

                        <StatusBadge
                          currentStatus={campaign.status}
                          options={statusOptions}
                          isOpen={statusDropdownId === campaign.id}
                          onToggle={() => setStatusDropdownId(statusDropdownId === campaign.id ? null : campaign.id)}
                          onClose={() => setStatusDropdownId(null)}
                          onChange={(status) => {
                            onChangeStatus?.(campaign.id, status)
                            setStatusDropdownId(null)
                          }}
                        />

                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(campaign.createdAt)}
                        </span>

                        <ActionButtons
                          onEdit={() => startEdit(campaign)}
                          onDelete={() => onDeleteCampaign?.(campaign.id)}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
