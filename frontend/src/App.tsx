import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/shell'
import { LoginPage } from '@/pages/LoginPage'
import { LeadsPage } from '@/pages/LeadsPage'
import ClientsPage from '@/pages/ClientsPage'
import CasesPage from '@/pages/CasesPage'
import SettingsPage from '@/pages/SettingsPage'
import BankProductsPage from '@/pages/BankProductsPage'
import WhatsAppPage from '@/pages/WhatsAppPage'
import { Users, UserCheck, Briefcase, MessageSquare, Building2 } from 'lucide-react'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // No caching - always refetch on invalidation
      retry: 1,
    },
  },
})

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Don't block rendering while loading - just redirect if not authenticated after check
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Main layout with shell
function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const workspaceItems = [
    {
      label: 'Leads',
      href: '/leads',
      icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
      isActive: location.pathname === '/leads',
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: <UserCheck className="w-5 h-5" strokeWidth={1.5} />,
      isActive: location.pathname === '/clients',
    },
    {
      label: 'Cases',
      href: '/cases',
      icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />,
      isActive: location.pathname === '/cases',
    },
  ]

  const toolboxItems = [
    {
      label: 'WhatsApp',
      href: '/whatsapp',
      icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
      isActive: location.pathname === '/whatsapp',
    },
    {
      label: 'Bank Products',
      href: '/bank-products',
      icon: <Building2 className="w-5 h-5" strokeWidth={1.5} />,
      isActive: location.pathname === '/bank-products',
    },
  ]

  return (
    <AppShell
      workspaceItems={workspaceItems}
      toolboxItems={toolboxItems}
      user={user ? { name: user.name } : undefined}
      settingsActive={location.pathname.startsWith('/settings')}
      onNavigate={(href) => navigate(href)}
      onSettingsClick={() => navigate('/settings')}
      onLogout={logout}
    >
      {children}
    </AppShell>
  )
}

// App routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/leads" replace />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/whatsapp" element={<WhatsAppPage />} />
                <Route path="/bank-products" element={<BankProductsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/*" element={<SettingsPage />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
