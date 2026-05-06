import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'news', label: 'News' },
  { id: 'about', label: 'About' },
  { id: 'products', label: 'Products' },
  { id: 'marketplaces', label: 'Shop' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar({ currentSection, showLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0f0f1a]/95 backdrop-blur-lg shadow-lg shadow-red-900/10 border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <svg viewBox="0 0 48 40" className="w-9 h-8 flex-shrink-0">
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
            <span className="font-anton text-xl md:text-2xl text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                  currentSection === item.id
                    ? 'text-white bg-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
                {currentSection === item.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#E3000B] rounded-full"
                  />
                )}
              </button>
            ))}
            {showLogin && (
              <button
                onClick={() => navigate('/login')}
                className="ml-3 px-5 py-2 text-sm font-semibold bg-[#E3000B] hover:bg-[#b80009] text-white rounded-lg transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 cursor-pointer"
              >
                Inventory Login
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center cursor-pointer"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1.5">
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 bg-white rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block w-6 h-0.5 bg-white rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="block w-6 h-0.5 bg-white rounded-full"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#1a1a2e]/98 backdrop-blur-lg border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    currentSection === item.id
                      ? 'text-white bg-red-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {showLogin && (
                <button
                  onClick={() => { setMobileOpen(false); navigate('/login'); }}
                  className="block w-full text-left px-4 py-3 mt-2 rounded-lg text-sm font-semibold bg-[#E3000B]/20 text-[#E3000B] hover:bg-[#E3000B]/30 transition-all cursor-pointer"
                >
                  📦 Inventory Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
