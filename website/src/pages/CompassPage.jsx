import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const COMPASS_URL = 'https://compass-replaybricks-v2-550.netlify.app/chat?auto=true';

export default function CompassPage({ user, onLogout }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.location.replace(COMPASS_URL);
  }, []);

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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-md text-sm text-gray-400">
            Compass opens in its own app now so Spring, uploads, and navigation stay on the correct URL.
          </p>
          <a
            href={COMPASS_URL}
            className="rounded-lg bg-[#4A90A2] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3b7d8d] transition-colors"
          >
            Open Compass
          </a>
        </div>
      </div>
    </div>
  );
}
