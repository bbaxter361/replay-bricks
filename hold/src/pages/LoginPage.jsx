import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Box, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('brian@replaybrick.com')
  const [password, setPassword] = useState('Brian!1138')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLogin) {
      const result = login(email, password)
      if (result.success) {
        toast.success('Welcome back, Brian!')
        navigate('/')
      } else {
        toast.error(result.error)
      }
    } else {
      if (!name.trim()) { toast.error('Name is required'); return }
      if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
      const result = register(name, email, password)
      if (result.success) {
        toast.success('Account created! Welcome!')
        navigate('/')
      } else {
        toast.error(result.error)
      }
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
          <div className="flex mb-6 bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isLogin ? 'bg-lego-red text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !isLogin ? 'bg-lego-red text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lego-red"
                    placeholder="Your name"
                  />
                </div>
              </div>
            )}
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
            {isLogin && (
              <p className="text-xs text-gray-500">
                Demo: brian@replaybrick.com / Brian!1138
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-lego-red hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
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
