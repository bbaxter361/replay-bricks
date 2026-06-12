import { useNavigate } from 'react-router-dom';

export default function InventoryPage({ user, onLogout }) {
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
            <svg viewBox="0 0 48 40" className="w-6 h-5">
              <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
              <circle cx="10" cy="20" r="2" fill="#FFD700"/>
              <circle cx="20" cy="20" r="2" fill="#FFD700"/>
              <circle cx="30" cy="20" r="2" fill="#FFD700"/>
              <circle cx="40" cy="20" r="2" fill="#FFD700"/>
            </svg>
            <span className="font-anton text-lg text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
            <span className="text-xs bg-[#E3000B]/20 text-[#E3000B] px-2 py-0.5 rounded-full font-medium">Inventory</span>
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
          src={import.meta.env.DEV ? 'http://localhost:5175?auto=true' : '/hold/?auto=true'}
          className="absolute inset-0 w-full h-full border-0"
          title="Replay Bricks Inventory"
        />
      </div>
    </div>
  );
}
