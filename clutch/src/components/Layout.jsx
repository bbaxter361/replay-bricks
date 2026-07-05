import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', exact: true },
  { to: '/inventory', icon: '📦', label: 'Inventory' },
  { to: '/orders', icon: '📋', label: 'Orders' },
  { to: '/pricing', icon: '💰', label: 'Auto-Pricing' },
  { to: '/price-dashboard', icon: '📈', label: 'Price Dashboard' },
  { to: '/part-out', icon: '🧩', label: 'Part-Out Tool' },
  { to: '/reports', icon: '📄', label: 'Reports' },
  { to: '/marketplaces', icon: '🏪', label: 'Marketplaces' },
  { to: '/pending', icon: '📝', label: 'Pending Review' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 900)
  }, [])

  useEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [checkMobile])

  // On mobile, sidebar is hidden by default and overlays
  // On desktop, sidebar is a permanent left panel
  const showSidebar = isMobile ? sidebarVisible : sidebarVisible

  const handleNavClick = () => {
    if (isMobile) setSidebarVisible(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#008080', position: 'relative' }}>
      
      {/* Mobile backdrop */}
      {isMobile && sidebarVisible && (
        <div 
          onClick={() => setSidebarVisible(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      {/* ── SIDEBAR ── */}
      {showSidebar && (
        <aside style={{
          width: '230px',
          minWidth: '230px',
          display: 'flex',
          flexDirection: 'column',
          background: '#C0C0C0',
          borderRight: '2px solid #808080',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: isMobile ? 50 : 'auto',
          boxShadow: isMobile ? '4px 0 12px rgba(0,0,0,0.5)' : 'none',
        }}>
          {/* Logo */}
          <div className="win95-titlebar win95-titlebar-gradient" style={{ flexShrink: 0, padding: '6px 8px' }}>
            <span className="win95-titlebar-text" style={{ fontSize: '15px' }}>🧱 Clutch</span>
            {isMobile && (
              <button onClick={() => setSidebarVisible(false)} className="win95-titlebar-btn">✕</button>
            )}
          </div>
          <div style={{ padding: '8px 10px 6px', background: '#C0C0C0', borderBottom: '1px solid #808080', flexShrink: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>Clutch</p>
            <p style={{ fontSize: '11px', color: '#404040' }}>Lego Inventory App</p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
            {navItems.map(item => {
              const isActive = item.exact 
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 12px',
                    fontSize: '14px',
                    textDecoration: 'none',
                    color: isActive ? '#FFFFFF' : '#000',
                    background: isActive ? '#000080' : 'transparent',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User */}
          <div style={{ padding: '10px', borderTop: '1px solid #808080', background: '#C0C0C0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Brian'}
                </p>
                <p style={{ fontSize: '11px', color: '#404040', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || 'brian@replaybrick.com'}
                </p>
              </div>
              <button onClick={logout} className="win95-button win95-button-sm" title="Logout" style={{ flexShrink: 0 }}>
                🚪
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Title bar */}
        <header className="win95-titlebar win95-titlebar-gradient" style={{ flexShrink: 0, padding: '5px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <button onClick={() => setSidebarVisible(v => !v)} className="win95-titlebar-btn" title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}>
              {sidebarVisible ? '◀' : '☰'}
            </button>
            <span className="win95-titlebar-text" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              🧱 Clutch — Lego Inventory App
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <a href="https://replaybrick.com/portal"
              className="win95-button win95-button-sm"
              style={{ fontSize: '12px', padding: '3px 10px', color: '#000', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏠 Portal
            </a>
            <div className="win95-titlebar-controls" style={{ marginLeft: '4px' }}>
              <button className="win95-titlebar-btn">─</button>
              <button className="win95-titlebar-btn">□</button>
              <button className="win95-titlebar-btn">✕</button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#C0C0C0' }}>
          <div className="win95-window" style={{ padding: '16px', minHeight: '100%' }}>
            {children}
          </div>
        </main>

        {/* Status bar */}
        <div className="win95-statusbar" style={{ flexShrink: 0, padding: '4px 10px', fontSize: '13px' }}>
          <span>{isMobile ? '📱 Mobile' : sidebarVisible ? 'Sidebar visible' : 'Sidebar hidden'}</span>
          <span>Clutch v2.0</span>
        </div>
      </div>
    </div>
  )
}
