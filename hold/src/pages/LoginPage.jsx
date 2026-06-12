import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Box, Eye, EyeOff, Lock, Mail } from 'lucide-react'
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
      if (result.success) {
        toast.success('Welcome back!')
        navigate('/')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lego-red rounded-2xl mb-4">
            <Box className="w-10 h-10 text-lego-gold" />
          </div>
          <h1 className="text-3xl font-bold text-white">Hold</h1>
          <p className="text-gray-400 mt-1">Inventory by Replay Bricks</p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              brian@replaybrick.com / Brian!1138
            </p>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-lego-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-6">
          Hold v1.0 — Private Inventory Management for Replay Bricks
        </p>
      </div>
    </div>
  )
}
