import { ArrowLeft, LogOut, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { navItems } from '../navigation';
import { useAppState } from '../state/appState';

export default function TopBar() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const logout = () => {
    dispatch({ type: 'logout' });
    navigate('/');
  };

  const backToPortal = () => {
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#ded0f2] bg-[#f7f1ff]/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a6fc4]">Local preview</p>
          <p className="font-black text-[#25183f]">Amanda's daily workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="app-button app-button-secondary" onClick={backToPortal} type="button">
            <ArrowLeft size={16} />
            Portal
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-[#ded0f2] bg-white px-3 py-2 text-sm font-bold text-[#4d3195]">
            <UserRound size={16} />
            {state.currentUser?.name}
          </div>
          <button className="app-button app-button-secondary" onClick={logout} type="button">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive ? 'bg-[#6d4cc2] text-white' : 'bg-white text-[#5a4873] border border-[#ded0f2]'
                }`
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
