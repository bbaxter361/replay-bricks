// Sidebar navigation component
// Responsive: full sidebar on desktop, hamburger menu on mobile

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageCircle,
  BookOpen,
  Menu,
  X,
  Compass
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/books', label: 'Books', icon: BookOpen },
  { path: '/chat', label: 'AI Chat', icon: MessageCircle },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-500 hover:bg-violet-100 transition-colors no-print"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50
          bg-violet-50 border-r border-violet-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo area */}
        <div className="p-5 border-b border-violet-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-300 rounded-xl flex items-center justify-center shadow-sm">
              <Compass size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-violet-700 leading-tight">Compass</h1>
              <p className="text-xs text-violet-500 font-medium">Resident Activities</p>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-violet-100 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X size={22} />
        </button>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-200 text-violet-700 border border-violet-300'
                    : 'text-gray-500 hover:bg-violet-100 hover:text-violet-700'
                }`
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-violet-200">
          <p className="text-xs text-gray-500 text-center">
            Made with ❤️ for Amanda
          </p>
        </div>
      </aside>
    </>
  );
}
