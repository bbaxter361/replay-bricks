import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PortalPage({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const sections = [
    {
      name: 'Replay Bricks',
      apps: [
        {
          id: 'inventory',
          title: 'Inventory Manager',
          subtitle: 'Hold — Bricqer Replacement',
          description: 'Manage your LEGO parts inventory, orders, pricing, part-outs, and marketplace sync across BrickLink and Brick Owl.',
          icon: (
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
              <rect x="8" y="16" width="64" height="48" rx="6" stroke="#E3000B" strokeWidth="3"/>
              <circle cx="24" cy="32" r="5" fill="#E3000B"/>
              <circle cx="40" cy="32" r="5" fill="#E3000B"/>
              <circle cx="56" cy="32" r="5" fill="#E3000B"/>
              <circle cx="24" cy="48" r="5" fill="#E3000B"/>
              <circle cx="40" cy="48" r="5" fill="#E3000B"/>
              <circle cx="56" cy="48" r="5" fill="#E3000B"/>
              <rect x="28" y="6" width="24" height="8" rx="3" fill="#E3000B"/>
            </svg>
          ),
          route: '/inventory',
          color: '#E3000B',
        },
      ],
    },
    {
      name: 'Spring Creek',
      apps: [
        {
          id: 'compass',
          title: 'Resident Activities',
          subtitle: "Amanda's Activities App",
          description: 'Activity planning, custom calendar, contact database, AI chat assistant, and business card scanner for memory care.',
          icon: (
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
              <circle cx="40" cy="40" r="32" stroke="#4A90A2" strokeWidth="3"/>
              <path d="M40 12 L44 36 L68 40 L44 44 L40 68 L36 44 L12 40 L36 36 Z" fill="#4A90A2" opacity="0.3" stroke="#4A90A2" strokeWidth="2"/>
              <circle cx="40" cy="40" r="6" fill="#4A90A2" opacity="0.6"/>
            </svg>
          ),
          route: 'https://compass-replaybricks-v2-550.netlify.app/',
          external: true,
          color: '#4A90A2',
        },
        {
          id: 'games',
          title: 'Memory Care Games',
          subtitle: 'Family Feud & Bingo',
          description: 'Interactive games designed for memory care residents — Family Feud style trivia and a full Bingo calling system with printable cards.',
          icon: (
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
              <circle cx="40" cy="40" r="34" stroke="#FF6B35" strokeWidth="3"/>
              <rect x="18" y="20" width="44" height="22" rx="4" fill="#FF6B35" opacity="0.2" stroke="#FF6B35" strokeWidth="2"/>
              <text x="40" y="36" textAnchor="middle" fill="#FF6B35" fontSize="14" fontWeight="bold" fontFamily="sans-serif">BINGO</text>
              <circle cx="30" cy="56" r="6" fill="#FF6B35" opacity="0.4"/>
              <circle cx="50" cy="56" r="6" fill="#FF6B35" opacity="0.4"/>
            </svg>
          ),
          route: '/games',
          color: '#FF6B35',
        },
      ],
    },
    {
      name: 'Our Baxter Family',
      apps: [
        {
          id: 'family',
          title: 'Our Baxter Family',
          subtitle: 'Family Dashboard',
          description: user?.email === 'amanda@replaybrick.com'
            ? 'View the family calendar and access your Gmail account.'
            : 'View the family calendar and access your Gmail and mybaxterfamily.com email accounts.',
          icon: (
            <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
              <circle cx="40" cy="28" r="14" stroke="#FFD700" strokeWidth="3"/>
              <circle cx="40" cy="28" r="5" fill="#FFD700" opacity="0.5"/>
              <path d="M16 68 Q16 46 40 46 Q64 46 64 68" stroke="#FFD700" strokeWidth="3" fill="#FFD700" opacity="0.15"/>
            </svg>
          ),
          route: '/baxter-family',
          color: '#FFD700',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm">Main Site</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 48 40" className="w-7 h-6">
              <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
              <circle cx="10" cy="20" r="2" fill="#FFD700"/>
              <circle cx="20" cy="20" r="2" fill="#FFD700"/>
              <circle cx="30" cy="20" r="2" fill="#FFD700"/>
              <circle cx="40" cy="20" r="2" fill="#FFD700"/>
            </svg>
            <span className="font-anton text-lg text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
            <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-medium">Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
          {/* Profile Switch Button - Only show for brian */}
          {user.email === 'brian@replaybrick.com' && (
            <button
              onClick={() => {
                const amandaUser = { email: 'amanda@replaybrick.com', name: 'Amanda' };
                localStorage.setItem('replay_user', JSON.stringify(amandaUser));
                window.location.reload();
              }}
              className="px-4 py-1.5 text-sm bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 hover:border-violet-400 rounded-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Switch to Amanda
            </button>
          )}
          {/* Profile Switch Button - Only show for amanda */}
          {user.email === 'amanda@replaybrick.com' && (
            <button
              onClick={() => {
                const brianUser = { email: 'brian@replaybrick.com', name: 'Brian' };
                localStorage.setItem('replay_user', JSON.stringify(brianUser));
                window.location.reload();
              }}
              className="px-4 py-1.5 text-sm bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400 rounded-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Switch to Brian
            </button>
          )}
        </div>
      </div>

      {/* Portal body */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome, {user.name}
            </h1>
            <p className="text-gray-400">
              Choose an application to launch
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section, sIdx) => (
              <div key={section.name}>
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * sIdx }}
                  className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 pl-1"
                >
                  {section.name}
                </motion.h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.apps.map((app, aIdx) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * sIdx + 0.1 * aIdx, duration: 0.5 }}
                    >
                      <button
                        onClick={() => {
                          if (app.external) {
                            window.location.href = app.route;
                            return;
                          }
                          navigate(app.route);
                        }}
                        className="w-full h-full text-left group relative bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-2xl p-6 md:p-7 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                      >
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                          style={{ background: `radial-gradient(ellipse at 50% 0%, ${app.color}, transparent 70%)` }}
                        />
                        <div className="relative z-10">
                          <div className="mb-4">{app.icon}</div>
                          <h2 className="text-xl font-bold text-white mb-1">{app.title}</h2>
                          <p className="text-sm font-medium mb-3" style={{ color: app.color }}>
                            {app.subtitle}
                          </p>
                          <p className="text-gray-400 text-sm leading-relaxed">{app.description}</p>
                          <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: app.color }}>
                            <span>Launch App</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
