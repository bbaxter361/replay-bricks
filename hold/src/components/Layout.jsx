import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  Puzzle, BarChart3, Store, Settings, LogOut, Menu, X, 
  Box, Airplay, ClipboardList 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/pricing', icon: DollarSign, label: 'Auto-Pricing' },
  { to: '/part-out', icon: Puzzle, label: 'Part-Out Tool' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/marketplaces', icon: Store, label: 'Marketplaces' },
  { to: '/travel', icon: Airplay, label: 'Travel Portal' },
  { to: '/pending', icon: ClipboardList, label: 'Pending Review' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-dark-card border-r border-dark-border 
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lego-red rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-lego-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Hold</h1>
              <p className="text-xs text-gray-400">by Replay Bricks</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.exact 
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-lego-red/20 text-lego-red border border-lego-red/30'
                    : 'text-gray-400 hover:text-white hover:bg-dark-surface border border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lego-red/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-lego-red">
                  {user?.name?.charAt(0) || 'B'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name || 'Brian'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'brian@replaybrick.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-lego-red rounded-lg hover:bg-dark-surface transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-dark-border bg-dark-card flex items-center px-4 gap-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-surface"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="hidden sm:inline">Inventory Management</span>
            <span className="hidden sm:inline">·</span>
            <span className="text-lego-gold font-medium">Hold v1.0</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
