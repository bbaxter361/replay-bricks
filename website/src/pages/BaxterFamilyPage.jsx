import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BaxterFamilyPage({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const isAmanda = user?.email === 'amanda@replaybrick.com';

  const emailLinks = isAmanda
    ? [
        {
          label: "Amanda's Gmail",
          url: 'https://mail.google.com/mail/u/0/',
          icon: '📧',
          desc: 'amanda@replaybrick.com',
        },
      ]
    : [
        {
          label: "Brian's Gmail",
          url: 'https://mail.google.com/mail/u/0/',
          icon: '📧',
          desc: 'brian@replaybrick.com',
        },
        {
          label: 'Baxter Family Email',
          url: 'https://mail.google.com/mail/u/1/',
          icon: '🏠',
          desc: 'brian@mybaxterfamily.com',
        },
      ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
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
            <svg viewBox="0 0 48 40" className="w-7 h-6">
              <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B" />
              <circle cx="10" cy="20" r="2" fill="#FFD700" />
              <circle cx="20" cy="20" r="2" fill="#FFD700" />
              <circle cx="30" cy="20" r="2" fill="#FFD700" />
              <circle cx="40" cy="20" r="2" fill="#FFD700" />
            </svg>
            <span className="font-anton text-lg text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
            <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full font-medium">
              Family
            </span>
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
        </div>
      </div>

      {/* Page body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto w-full">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Our Baxter Family
            </h1>
            <p className="text-gray-400">
              Family calendar and email access — everything in one place.
            </p>
          </motion.div>

          {/* Email Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 pl-1">
              Email Accounts
            </h2>
            <div className={`grid gap-6 ${emailLinks.length === 1 ? 'sm:grid-cols-1 md:grid-cols-1 max-w-md' : 'sm:grid-cols-2'}`}>
              {emailLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * i + 0.1, duration: 0.5 }}
                  className="group relative bg-[#1a1a2e] border border-white/10 hover:border-[#FFD700]/40 rounded-2xl p-7 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#FFD700]/5 cursor-pointer block"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, #FFD700, transparent 70%)' }}
                  />
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">{link.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{link.label}</h3>
                    <p className="text-sm text-gray-400">{link.desc}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#FFD700]">
                      <span>Open Gmail</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Google Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4 pl-1">
              Family Calendar
            </h2>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
              <iframe
                src="https://calendar.google.com/calendar/embed?src=b6h2kihj5etc6mm8g4smkq31k4%40group.calendar.google.com&ctz=America%2FChicago"
                className="w-full h-[500px] md:h-[600px]"
                style={{ border: 0 }}
                title="Baxter Family Calendar"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
