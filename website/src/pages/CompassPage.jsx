import { useNavigate } from 'react-router-dom';

export default function CompassPage({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f1a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Portal</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 80 80" className="w-6 h-6" fill="none">
              <circle cx="40" cy="40" r="32" stroke="#4A90A2" strokeWidth="3"/>
              <path d="M40 12 L44 36 L68 40 L44 44 L40 68 L36 44 L12 40 L36 36 Z" fill="#4A90A2" opacity="0.3" stroke="#4A90A2" strokeWidth="2"/>
              <circle cx="40" cy="40" r="6" fill="#4A90A2" opacity="0.6"/>
            </svg>
            <span className="font-anton text-lg text-white tracking-wider">
              REPLAY<span className="text-[#4A90A2]">.</span>BRICKS
            </span>
            <span className="text-xs bg-[#4A90A2]/20 text-[#4A90A2] px-2 py-0.5 rounded-full font-medium">Compass</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.name}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* App iframe */}
      <div className="flex-1 relative">
        <iframe
          src="http://localhost:5174?auto=true"
          className="absolute inset-0 w-full h-full border-0"
          title="Compass Memory Care"
        />
      </div>
    </div>
  );
}
