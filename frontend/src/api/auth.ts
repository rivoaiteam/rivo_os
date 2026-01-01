import api, { setToken, removeToken } from './client'

export interface User {
  id: number
  username: string
  email: string
  name: string
  firstName: string
  lastName: string
  status: 'active' | 'inactive'
}

export interface LoginCredentials {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post<LoginResponse>('/auth/login/', credentials)
    setToken(response.data.token)
    return response.data.user
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout/')
    removeToken()
  },

  // Get current user
  async me(): Promise<User> {
    const response = await api.get<User>('/auth/me/')
    return response.data
  },
}
