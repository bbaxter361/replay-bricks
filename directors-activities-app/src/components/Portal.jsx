import { ArrowRight, BriefcaseBusiness, HeartHandshake, ShieldCheck, Sparkles, Star, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './StatusPill';
import { useAppState } from '../state/appState';
import { getVisiblePortalApps } from '../utils/accessRules';

const iconByApp = {
  directors: HeartHandshake,
  clutch: BriefcaseBusiness,
  baxter: UsersRound,
  'star-wars': Star,
};

export default function Portal() {
  const { state, dispatch } = useAppState();
  const [selectedUserId, setSelectedUserId] = useState(state.currentUser?.id || 'user-brian');
  const navigate = useNavigate();
  const selectedUser = state.users.find((user) => user.id === selectedUserId) || state.users[0];
  const visibleApps = useMemo(
    () => getVisiblePortalApps(selectedUser, state.portalApps),
    [selectedUser, state.portalApps],
  );

  const openApp = (app) => {
    if (app.id === 'directors') {
      dispatch({ type: 'setUser', user: selectedUser });
      navigate('/app');
      return;
    }
    dispatch({
      type: 'showAppNotice',
      notice: `${app.name} is visible for ${selectedUser.name}, but this rebuild is focused on Director's Activities App first.`,
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 text-[#202232]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-lg border border-[#d9dee8] bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-3 py-1 text-sm font-bold text-[#4b5565]">
                <ShieldCheck size={16} />
                Private portal preview
              </div>
              <h1 className="max-w-2xl text-3xl font-black md:text-5xl">Director's Activities App</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085] md:text-base">
                A warm, professional workspace for Spring, calendars, residents, activities, and Amanda's daily print flow.
              </p>
            </div>
            <div className="rounded-lg border border-[#d9dee8] bg-[#f8fafc] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#667085]">Preview as</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.users.map((user) => (
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                      selectedUserId === user.id ? 'bg-[#202232] text-white' : 'bg-white text-[#4b5565] hover:bg-[#eef2f7]'
                    }`}
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      dispatch({ type: 'clearAppNotice' });
                    }}
                    type="button"
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {state.selectedAppNotice && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#d9dee8] bg-white p-4 text-sm text-[#4b5565]">
            <Sparkles className="text-[#6d4cc2]" size={18} />
            {state.selectedAppNotice}
          </div>
        )}

        <section className="page-grid">
          {visibleApps.map((app) => {
            const Icon = iconByApp[app.id] || Sparkles;
            const isDirector = app.id === 'directors';
            return (
              <button className="rounded-lg border border-[#d9dee8] bg-white text-left shadow-xl shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-[#98a2b3]" key={app.id} onClick={() => openApp(app)} type="button">
                <div className="flex h-full flex-col gap-5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isDirector ? 'bg-[#efe4ff] text-[#6d4cc2]' : 'bg-[#eef2f7] text-[#344054]'}`}>
                      <Icon size={24} />
                    </div>
                    <StatusPill tone={app.status === 'local-preview' ? 'green' : 'gold'}>{app.status}</StatusPill>
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{app.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#74638d]">{app.subtitle}</p>
                  </div>
                  <div className={`mt-auto flex items-center gap-2 text-sm font-black ${isDirector ? 'text-[#6d4cc2]' : 'text-[#344054]'}`}>
                    {app.id === 'directors' ? 'Open app' : 'Preview visibility'}
                    <ArrowRight size={16} />
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
