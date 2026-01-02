import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X, Check, Pencil, Trash2 } from 'lucide-react'
import { getChannelConfig, type FixedChannelType, type SubSourceStatus, type TrustLevel } from '@/types/settings'
import {
  useSources,
  useCreateSource,
  useUpdateSource,
  useDeleteSource,
  useSubSources,
  useCreateSubSource,
  useUpdateSubSource,
  useDeleteSubSource,
} from '@/hooks/useSettings'

// Status options based on trust level
const UNTRUSTED_STATUSES: { value: SubSourceStatus; label: string; color: string }[] = [
  { value: 'incubation', label: 'Incubation', color: 'bg-amber-100 text-amber-700' },
  { value: 'live', label: 'Live', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'paused', label: 'Paused', color: 'bg-slate-200 text-slate-500' },
]

const TRUSTED_STATUSES: { value: SubSourceStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-slate-200 text-slate-500' },
]

function getStatusOptions(trustLevel: TrustLevel) {
  return trustLevel === 'untrusted' ? UNTRUSTED_STATUSES : TRUSTED_STATUSES
}

function getDefaultStatus(trustLevel: TrustLevel): SubSourceStatus {
  return trustLevel === 'untrusted' ? 'incubation' : 'active'
}

function getStatusStyle(status: SubSourceStatus, trustLevel: TrustLevel) {
  const options = getStatusOptions(trustLevel)
  return options.find(o => o.value === status)?.color || 'bg-slate-200 text-slate-500'
}

function getStatusLabel(status: SubSourceStatus, trustLevel: TrustLevel) {
  const options = getStatusOptions(trustLevel)
  return options.find(o => o.value === status)?.label || status
}

// Source section with its sub-sources
function SourceSection({ sourceId, sourceName, trustLevel, onEditSource, onDeleteSource }: {
  sourceId: string
  sourceName: string
  trustLevel: TrustLevel
  onEditSource: () => void
  onDeleteSource: () => void
}) {
  const { data: subSources = [] } = useSubSources(sourceId)
  const createSubSource = useCreateSubSource()
  const updateSubSource = useUpdateSubSource()
  const deleteSubSource = useDeleteSubSource()

  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const statusOptions = getStatusOptions(trustLevel)

  const handleAdd = async () => {
    if (!newName.trim()) return
    await createSubSource.mutateAsync({
      sourceId,
      name: newName.trim(),
      status: getDefaultStatus(trustLevel)
    })
    setNewName('')
    setIsAdding(false)
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    await updateSubSource.mutateAsync({ id, data: { name: editName.trim() } })
    setEditingId(null)
  }

  const cycleStatus = (currentStatus: SubSourceStatus) => {
    const idx = statusOptions.findIndex(o => o.value === currentStatus)
    const nextIdx = (idx + 1) % statusOptions.length
    return statusOptions[nextIdx].value
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {/* Source header row */}
        <div className="flex items-center justify-between p-3 bg-slate-50">
          <span className="text-sm font-medium text-slate-900">{sourceName}</span>
          <div className="flex items-center gap-2">
            <button onClick={onEditSource} className="p-1 text-slate-400 hover:text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDeleteSource} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Sub-sources */}
        {subSources.map((sub) => (
          <div key={sub.id} className="flex items-center justify-between p-3 pl-6">
            {editingId === sub.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit(sub.id)}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded bg-white"
                />
                <button onClick={() => handleEdit(sub.id)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <span className="text-sm text-slate-700">{sub.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={sub.defaultSlaMin ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      updateSubSource.mutate({
                        id: sub.id,
                        data: { defaultSlaMin: val === '' ? undefined : parseInt(val) }
                      })
                    }}
                    placeholder="SLA(mins)"
                    className="w-20 px-2 py-0.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateSubSource.mutate({ id: sub.id, data: { status: cycleStatus(sub.status) } })}
                    className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(sub.status, trustLevel)}`}
                  >
                    {getStatusLabel(sub.status, trustLevel)}
                  </button>
                  <button onClick={() => { setEditingId(sub.id); setEditName(sub.name) }} className="p-1 text-slate-400 hover:text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteSubSource.mutate(sub.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-2 p-3 pl-6">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Sub-source name"
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded bg-white"
            />
            <button onClick={handleAdd} className="text-emerald-600"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setIsAdding(false); setNewName('') }} className="text-slate-400"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="p-3 pl-6 text-sm text-blue-600 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Sub-source
          </button>
        )}
      </div>
    </div>
  )
}

export function ChannelDetailPage() {
  const navigate = useNavigate()
  const { channelId } = useParams<{ channelId: string }>()
  const channel = getChannelConfig(channelId as FixedChannelType)

  const { data: sources = [] } = useSources(channelId as FixedChannelType)
  const createSource = useCreateSource()
  const updateSource = useUpdateSource()
  const deleteSource = useDeleteSource()

  const [isAddingSource, setIsAddingSource] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editSourceName, setEditSourceName] = useState('')

  if (!channel) return <div className="p-6 text-slate-500">Channel not found</div>

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    await createSource.mutateAsync({ channelId: channel.id, name: newSourceName.trim() })
    setNewSourceName('')
    setIsAddingSource(false)
  }

  const handleEditSource = async (id: string) => {
    if (!editSourceName.trim()) return
    await updateSource.mutateAsync({ id, data: { name: editSourceName.trim() } })
    setEditingSourceId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/settings/channels')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> Channels
      </button>

      <h1 className="text-xl font-semibold text-slate-900">{channel.name}</h1>
      <p className="text-sm text-slate-500 mb-6">{channel.description}</p>

      <>
          {sources.map((source) => (
            editingSourceId === source.id ? (
              <div key={source.id} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editSourceName}
                    onChange={(e) => setEditSourceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSource(source.id)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm font-medium border border-slate-300 rounded bg-white"
                  />
                  <button onClick={() => handleEditSource(source.id)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingSourceId(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ) : channel.hasSubSources ? (
              <SourceSection
                key={source.id}
                sourceId={source.id}
                sourceName={source.name}
                trustLevel={channel.trustLevel}
                onEditSource={() => { setEditingSourceId(source.id); setEditSourceName(source.name) }}
                onDeleteSource={() => deleteSource.mutate(source.id)}
              />
            ) : (
              <div key={source.id} className="mb-6">
                <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{source.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingSourceId(source.id); setEditSourceName(source.name) }} className="p-1 text-slate-400 hover:text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteSource.mutate(source.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          ))}

          {isAddingSource ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                placeholder="Source name"
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded bg-white"
              />
              <button onClick={handleAddSource} className="text-emerald-600"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setIsAddingSource(false); setNewSourceName('') }} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setIsAddingSource(true)} className="text-sm text-blue-600 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Source
            </button>
          )}
        </>
    </div>
  )
}