import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      navigate('/leads')
    } catch {
      setError('Invalid credentials. Please check your username and password.')
    } finally {
      setIsLoading(false)
    }
  }

  const isUsernameValid = username.length >= 3
  const isPasswordValid = password.length >= 4

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 bg-white pb-24">
        {/* Logo */}
        <div className="-mb-12">
          <img
            src="/rivo-logo.png"
            alt="Rivo - Mortgage Management Platform"
            className="scale-[0.6]"
          />
        </div>

        {/* Welcome text */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1 text-center">
          Welcome to Rivo
        </h1>
        <p className="text-slate-600 mb-6 text-center text-sm">
          Your smart mortgage partner. Close deals faster.
        </p>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm"
          aria-label="Login form"
        >
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 pr-12 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !isUsernameValid || !isPasswordValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            aria-label="Sign in to your account"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Continue'
            )}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-slate-400">
          <p>Powered by Brookhaven Properties</p>
        </div>
      </div>

      {/* Right side - Quote section */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center p-16 relative overflow-hidden">
        <div className="text-white max-w-md relative z-10">
          <svg className="w-10 h-10 text-white/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-xl font-light leading-relaxed mb-6">
            With over 20 years in Dubai's banking and real estate market, I've seen many tools come and go. Rivo stands out as a true game-changer for managing mortgages efficiently.
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
              AG
            </div>
            <div>
              <p className="text-white font-medium text-sm">Aneesh Gopalan</p>
              <p className="text-blue-200 text-xs">20+ Years in Dubai Banking & Real Estate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}