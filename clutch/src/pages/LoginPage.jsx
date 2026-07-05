import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('brian@replaybrick.com')
  const [password, setPassword] = useState('Brian!1138')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const result = await login(email, password)
      if (result.success) { toast.success('Welcome back!'); navigate('/') }
      else toast.error(result.error)
    } catch { toast.error('Login failed') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#008080', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Desktop-style icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div className="win95-desktop-icon" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '48px' }}>🧱</span>
            <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 'bold' }}>Clutch</span>
            <span style={{ fontSize: '10px', color: '#C0C0C0' }}>Lego Inventory</span>
          </div>
        </div>

        {/* Login window */}
        <div className="win95-window">
          <div className="win95-titlebar win95-titlebar-gradient">
            <span className="win95-titlebar-text">🔐 Sign In</span>
            <div className="win95-titlebar-controls">
              <button className="win95-titlebar-btn">✕</button>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px' }}>Email:</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="win95-input" placeholder="you@example.com" required />
              </div>
              <div>
                <label style={{ fontSize: '11px', display: 'block', marginBottom: '3px' }}>Password:</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="win95-input" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="win95-button win95-button-sm" style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', padding: '1px 4px', minWidth: 'auto' }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '10px', color: '#808080' }}>brian@replaybrick.com / Brian!1138</p>
              <button type="submit" disabled={busy} className="win95-button" style={{ width: '100%', fontWeight: 'bold' }}>
                {busy ? '⏳ Signing in...' : 'OK'}
              </button>
              <a href="https://replaybrick.com/portal" style={{ fontSize: '11px', color: '#0000FF', textAlign: 'center', display: 'block' }}>
                ← Back to Portal
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
