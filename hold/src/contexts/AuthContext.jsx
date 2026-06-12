import { createContext, useContext, useState, useEffect } from 'react'
import { setApiToken } from '../api'

const AuthContext = createContext()

const SESSION_KEY = 'hold_session'
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3002/api'
  : 'https://replaybrick.com/api/hold';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session
    const session = localStorage.getItem(SESSION_KEY)
    // Auto-login if coming from website iframe with auto=true
    const params = new URLSearchParams(window.location.search)
    const autoUser = params.get('auto')
    if (autoUser === 'true' && !session) {
      // Auto-login against the real API
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'brian@replaybrick.com', password: 'Brian!1138' }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            setApiToken(data.token)
            const u = { email: 'brian@replaybrick.com', name: 'Brian' }
            localStorage.setItem(SESSION_KEY, JSON.stringify(u))
            setUser(u)
          }
        })
        .catch(() => {})
    } else if (session) {
      try {
        setUser(JSON.parse(session))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()
      if (data.ok) {
        setApiToken(data.token)
        const sessionUser = { email, name: data.name || email.split('@')[0] }
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
        return { success: true }
      }
      return { success: false, error: data.error || 'Login failed' }
    } catch (err) {
      return { success: false, error: 'Cannot reach server' }
    }
  }

  const logout = () => {
    setApiToken(null)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
