import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi, type User } from '@/api/auth'
import { getToken, removeToken } from '@/api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const user = await authApi.me()
        setUser(user)
      } catch {
        removeToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    const user = await authApi.login({ username, password })
    setUser(user)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Token might already be invalid, just remove it
    }
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
