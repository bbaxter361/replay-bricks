import { useNavigate } from 'react-router-dom';

const COMPASS_PORTAL_URL = 'https://baxter-directors-activities.netlify.app/';

export default function PortalPage({ user, onLogout }) {
  const navigate = useNavigate();
  const portalUser = user?.email === 'amanda@replaybrick.com' ? 'amanda' : 'brian';
  const portalUrl = `${COMPASS_PORTAL_URL}?user=${portalUser}`;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-[#202232]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
            type="button"
          >
            Main Site
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Replay Bricks</p>
            <h1 className="text-xl font-black text-[#202232]">Compass Portal</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
            type="button"
          >
            Sign Out
          </button>
        </div>
      </header>

      <iframe
        className="min-h-[calc(100vh-73px)] w-full flex-1 border-0 bg-white"
        src={portalUrl}
        title="Compass Portal"
      />
    </div>
  );
}
