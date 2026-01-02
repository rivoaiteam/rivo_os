import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Check, ChevronLeft, Pencil, Eye, EyeOff } from 'lucide-react'
import {
  ActionButtons,
  EditActionButtons,
  EmptyState,
} from './SettingsTableElements'
import type { User, UserStatus } from '@/types/settings'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSystemSettings,
  useUpdateSystemSettings,
} from '@/hooks/useSettings'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

// Status options - same style as Channels page
const statusOptions = [
  {
    value: 'active' as const,
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    value: 'inactive' as const,
    label: 'Inactive',
    color: 'bg-slate-200 text-slate-500',
  },
]

export function UsersPage() {
  const navigate = useNavigate()
  const { data: users = [] } = useUsers()
  const { data: systemSettings } = useSystemSettings()
  const updateSystemSettings = useUpdateSystemSettings()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')

  // System password state
  const [isEditingSystemPassword, setIsEditingSystemPassword] = useState(false)
  const [systemPasswordValue, setSystemPasswordValue] = useState('')
  const [showSystemPassword, setShowSystemPassword] = useState(false)

  useEffect(() => {
    if (systemSettings) {
      setSystemPasswordValue(systemSettings.systemPassword || '')
    }
  }, [systemSettings])

  const handleAdd = async () => {
    if (newName.trim()) {
      const [firstName, ...lastParts] = newName.trim().split(' ')
      const lastName = lastParts.join(' ')
      // Auto-generate username from name (lowercase, no spaces)
      const username = newName.trim().toLowerCase().replace(/\s+/g, '.')
      const email = `${username}@rivo.ae`
      await createUser.mutateAsync({
        username,
        email,
        firstName,
        lastName,
        password: 'temp', // Backend uses system password for auth
        status: 'active',
      })
      setNewName('')
      setIsAdding(false)
    }
  }

  const handleEdit = async (id: number) => {
    if (editName.trim()) {
      const [firstName, ...lastParts] = editName.trim().split(' ')
      const lastName = lastParts.join(' ')
      await updateUser.mutateAsync({ id, data: { firstName, lastName } })
      setEditingId(null)
      setEditName('')
    }
  }

  // Cycle to next status (like Channels page)
  const cycleStatus = (currentStatus: UserStatus): UserStatus => {
    const idx = statusOptions.findIndex(o => o.value === currentStatus)
    const nextIdx = (idx + 1) % statusOptions.length
    return statusOptions[nextIdx].value
  }

  const getStatusStyle = (status: UserStatus) => {
    return statusOptions.find(o => o.value === status)?.color || 'bg-slate-200 text-slate-500'
  }

  const getStatusLabel = (status: UserStatus) => {
    return statusOptions.find(o => o.value === status)?.label || status
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this user?')) {
      await deleteUser.mutateAsync(id)
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditName(`${user.firstName} ${user.lastName}`.trim())
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewName('')
  }


  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 -ml-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Settings
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Users</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage team members who can access the dashboard
            </p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>

        {/* System Password */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-900">System Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">Shared password for all users</p>
            </div>
            {isEditingSystemPassword ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type={showSystemPassword ? 'text' : 'password'}
                    value={systemPasswordValue}
                    onChange={(e) => setSystemPasswordValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (systemPasswordValue.length >= 6) {
                          updateSystemSettings.mutate({ systemPassword: systemPasswordValue })
                          setIsEditingSystemPassword(false)
                        }
                      }
                      if (e.key === 'Escape') {
                        setSystemPasswordValue(systemSettings?.systemPassword || '')
                        setIsEditingSystemPassword(false)
                      }
                    }}
                    placeholder="Enter system password"
                    autoFocus
                    className="w-48 px-3 py-1.5 pr-8 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSystemPassword(!showSystemPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSystemPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (systemPasswordValue.length >= 6) {
                      updateSystemSettings.mutate({ systemPassword: systemPasswordValue })
                      setIsEditingSystemPassword(false)
                    }
                  }}
                  disabled={systemPasswordValue.length < 6}
                  className="p-1 text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                  title={systemPasswordValue.length < 6 ? 'Password must be at least 6 characters' : ''}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSystemPasswordValue(systemSettings?.systemPassword || '')
                    setIsEditingSystemPassword(false)
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {systemSettings?.systemPassword ? '••••••••' : 'Not set'}
                </span>
                <button
                  onClick={() => setIsEditingSystemPassword(true)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {/* Add new user row */}
          {isAdding && (
            <div className="flex items-center justify-between p-4 bg-blue-50">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') cancelAdd()
                }}
                placeholder="Full name"
                autoFocus
                className="flex-1 max-w-xs px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">
                  Active
                </span>
                <EditActionButtons
                  onSave={handleAdd}
                  onCancel={cancelAdd}
                  disabled={!newName.trim()}
                />
              </div>
            </div>
          )}

          {/* User rows */}
          {users.length === 0 && !isAdding ? (
            <EmptyState message="No users yet. Add your first team member." />
          ) : (
            users.map((user) => {
              const displayName = `${user.firstName} ${user.lastName}`.trim() || user.username
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  {editingId === user.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(user.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                        className="flex-1 max-w-xs px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(user.dateJoined)}
                        </span>
                        <EditActionButtons
                          onSave={() => handleEdit(user.id)}
                          onCancel={cancelEdit}
                          disabled={!editName.trim()}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-medium text-slate-900 block">
                          {displayName}
                        </span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {formatDate(user.dateJoined)}
                        </span>
                        <button
                          onClick={() => updateUser.mutate({ id: user.id, data: { status: cycleStatus(user.status) } })}
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(user.status)}`}
                        >
                          {getStatusLabel(user.status)}
                        </button>
                        <ActionButtons
                          onEdit={() => startEdit(user)}
                          onDelete={() => handleDelete(user.id)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
