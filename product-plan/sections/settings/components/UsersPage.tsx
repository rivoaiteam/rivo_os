import { useState } from 'react'
import { Plus, X, Check, Eye, EyeOff, Key } from 'lucide-react'
import {
  StatusBadge,
  ActionButtons,
  EditActionButtons,
  formatDate,
  EmptyState,
} from './SettingsTableElements'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  status: UserStatus
  createdAt: string
}

const statusOptions = [
  {
    value: 'active' as const,
    label: 'Active',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    value: 'inactive' as const,
    label: 'Inactive',
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
  },
]

interface UsersPageProps {
  users: User[]
  systemPassword: string
  onAddUser?: (name: string) => void
  onEditUser?: (id: string, name: string) => void
  onDeleteUser?: (id: string) => void
  onChangeStatus?: (id: string, status: UserStatus) => void
  onChangePassword?: (password: string) => void
}

export function UsersPage({
  users,
  systemPassword,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onChangeStatus,
  onChangePassword,
}: UsersPageProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')

  // Password state
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleAdd = () => {
    if (newName.trim()) {
      onAddUser?.(newName.trim())
      setNewName('')
      setIsAdding(false)
    }
  }

  const handleEdit = (id: string) => {
    if (editName.trim()) {
      onEditUser?.(id, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditName(user.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewName('')
  }

  const handleSavePassword = () => {
    if (newPassword.trim()) {
      onChangePassword?.(newPassword.trim())
      setIsEditingPassword(false)
      setNewPassword('')
      setShowPassword(false)
    }
  }

  const cancelPasswordEdit = () => {
    setIsEditingPassword(false)
    setNewPassword('')
    setShowPassword(false)
  }

  const gridCols = 'grid-cols-4'

  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Users</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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

        {/* System Password Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">System Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shared password for all active users to log in
                </p>
              </div>
            </div>

            {isEditingPassword ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePassword()
                      if (e.key === 'Escape') cancelPasswordEdit()
                    }}
                    placeholder="Enter new password"
                    autoFocus
                    className="w-48 px-3 py-1.5 pr-9 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSavePassword}
                  disabled={!newPassword.trim()}
                  className="p-1.5 text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 dark:disabled:text-slate-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelPasswordEdit}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {'•'.repeat(systemPassword.length || 8)}
                </span>
                <button
                  onClick={() => {
                    setIsEditingPassword(true)
                    setNewPassword(systemPassword)
                  }}
                  className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  title="Change password"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[300px]">
          {/* Table Header */}
          <div className={`grid ${gridCols} gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700`}>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Name
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Created
            </div>
            <div></div>
          </div>

          {/* Add new user row */}
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
                placeholder="User name"
                autoFocus
                className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">Starts as Active</span>
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

          {/* User rows */}
          {users.length === 0 && !isAdding ? (
            <EmptyState message="No users yet. Add your first team member." />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => {
                const currentOption = statusOptions.find((opt) => opt.value === user.status)
                return (
                  <div
                    key={user.id}
                    className={`grid ${gridCols} gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors items-center`}
                  >
                    {editingId === user.id ? (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEdit(user.id)
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
                          {formatDate(user.createdAt)}
                        </span>
                        <EditActionButtons
                          onSave={() => handleEdit(user.id)}
                          onCancel={cancelEdit}
                          disabled={!editName.trim()}
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </span>

                        <StatusBadge
                          currentStatus={user.status}
                          options={statusOptions}
                          isOpen={statusDropdownId === user.id}
                          onToggle={() => setStatusDropdownId(statusDropdownId === user.id ? null : user.id)}
                          onClose={() => setStatusDropdownId(null)}
                          onChange={(status) => {
                            onChangeStatus?.(user.id, status)
                            setStatusDropdownId(null)
                          }}
                        />

                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(user.createdAt)}
                        </span>

                        <ActionButtons
                          onEdit={() => startEdit(user)}
                          onDelete={() => onDeleteUser?.(user.id)}
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
