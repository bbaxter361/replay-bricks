import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const USERS_KEY = 'hold_users'
const SESSION_KEY = 'hold_session'

const defaultUser = {
  email: 'brian@replaybrick.com',
  password: 'Brian!1138',
  name: 'Brian',
}

const amandaUser = {
  email: 'amanda@replaybrick.com',
  password: 'Brian!1138',
  name: 'Amanda',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) {
      localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser, amandaUser]))
    }
    // Auto-login if coming from website iframe with auto=true
    const params = new URLSearchParams(window.location.search)
    const autoUser = params.get('auto')
    const session = localStorage.getItem(SESSION_KEY)
    if (autoUser === 'true' && !session) {
      const autoLogin = { email: defaultUser.email, name: defaultUser.name }
      localStorage.setItem(SESSION_KEY, JSON.stringify(autoLogin))
      setUser(autoLogin)
    } else if (session) {
      try {
        setUser(JSON.parse(session))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (found) {
      const sessionUser = { email: found.email, name: found.name }
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
      return { success: true }
    }
    return { success: false, error: 'Invalid email or password' }
  }

  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' }
    }
    users.push({ name, email, password })
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    const sessionUser = { email, name }
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
