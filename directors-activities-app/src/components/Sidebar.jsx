import { NavLink } from 'react-router-dom';
import { navItems } from '../navigation';

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[#ded0f2] bg-[#fffafe]/88 p-4 lg:block">
      <div className="mb-6 flex items-center gap-3 px-2">
        <img alt="Compass App" className="h-12 w-12 rounded-lg object-contain" src="/compass-logo.png" />
        <div>
          <p className="text-sm font-black text-[#25183f]">Compass App</p>
          <p className="text-sm font-black text-[#6d4cc2]">Director's Activities</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  isActive ? 'bg-[#6d4cc2] text-white' : 'text-[#5a4873] hover:bg-[#efe4ff]'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
