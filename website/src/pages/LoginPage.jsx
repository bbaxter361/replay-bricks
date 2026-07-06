import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const CREDENTIALS = [
    { email: 'brian@replaybrick.com', password: 'Brian!1138', name: 'Brian' },
    { email: 'amanda@replaybrick.com', password: 'Brian!1138', name: 'Amanda' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );

    if (user) {
      onLogin(user);
      navigate('/portal');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] relative">
      {/* Background gradient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#E3000B]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#FFD700]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg viewBox="0 0 48 40" className="w-12 h-10">
              <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
              <circle cx="10" cy="20" r="2" fill="#FFD700"/>
              <circle cx="20" cy="20" r="2" fill="#FFD700"/>
              <circle cx="30" cy="20" r="2" fill="#FFD700"/>
              <circle cx="40" cy="20" r="2" fill="#FFD700"/>
              <circle cx="10" cy="30" r="2" fill="#FFD700"/>
              <circle cx="20" cy="30" r="2" fill="#FFD700"/>
              <circle cx="30" cy="30" r="2" fill="#FFD700"/>
              <circle cx="40" cy="30" r="2" fill="#FFD700"/>
            </svg>
            <span className="font-anton text-2xl text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Compass Portal</h1>
          <p className="text-gray-500 mt-1">Sign in to open your portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-gray-500 text-xs text-center">
              Private Compass Portal — authorized users only
            </p>
          </div>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to Replay Bricks
          </a>
        </div>
      </motion.div>
    </div>
  );
}
