import { Outlet, useLocation, Link } from 'react-router-dom'
import { BarChart3, CheckSquare, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Checklist',
      href: '/checklist',
      icon: CheckSquare,
      current: location.pathname.startsWith('/checklist')
    },
    {
      name: 'Configurar',
      href: '/config',
      icon: Settings,
      current: location.pathname === '/config'
    }
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              J. Cruzeiro
            </h1>
            <p className="text-sm text-gray-500">
              Checklist Gerencial
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.nome}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="tab-bar">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`tab-item ${
                  item.current ? 'active' : ''
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}