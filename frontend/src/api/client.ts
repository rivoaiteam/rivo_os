import axios from 'axios'

const TOKEN_KEY = 'auth_token'

// Create axios instance with default config
// Note: Don't set Content-Type here - let axios set it automatically
// For FormData, axios will set multipart/form-data with proper boundary
// For JSON, axios will set application/json automatically
const api = axios.create({
  baseURL: '/api',
})

// Get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Set token in localStorage
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

// Remove token from localStorage
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Add Authorization header to all requests
// Also handle FormData - remove Content-Type so axios can set it with proper boundary
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set('Authorization', `Token ${token}`)
  }

  // If sending FormData, delete Content-Type so axios can set it with proper boundary
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
