import { ClipboardCheck, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { selectBingoBalance, useAppState } from '../state/appState';

export default function Residents() {
  const { state, dispatch } = useAppState();
  const [isBingoDialogOpen, setIsBingoDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [bingoBucks, setBingoBucks] = useState('');
  const [activityName, setActivityName] = useState('');
  const selected = state.residents.find((resident) => resident.id === state.selectedResidentId) || state.residents[0];
  const balance = selected ? selectBingoBalance(state, selected.id) : 0;
  const transactions = state.bingoTransactions.filter((item) => item.residentId === selected?.id);
  const activityAttendance = (state.residentActivityAttendance || []).filter((item) => item.residentId === selected?.id);

  const addPoints = (amount, reason, createdAt) => {
    dispatch({ type: 'addBingoTransaction', transaction: { residentId: selected.id, amount, reason, createdAt } });
  };

  const submitBingoBucks = (event) => {
    event.preventDefault();
    const amount = Number(bingoBucks);
    if (!Number.isFinite(amount)) return;

    addPoints(amount, 'Attended bingo', new Date().toISOString());
    setBingoBucks('');
    setIsBingoDialogOpen(false);
  };

  const submitActivityAttendance = (event) => {
    event.preventDefault();
    const trimmedActivityName = activityName.trim();
    if (!trimmedActivityName) return;

    dispatch({
      type: 'addResidentActivityAttendance',
      attendance: {
        residentId: selected.id,
        activityName: trimmedActivityName,
        createdAt: new Date().toISOString(),
      },
    });
    setActivityName('');
    setIsActivityDialogOpen(false);
  };

  const formatEntryDate = (value) => {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      <SectionHeader eyebrow="Residents" title="People, Preferences, And Bingo Points">
        Resident profiles give Spring the context to choose better activities and help Amanda see who needs attention.
      </SectionHeader>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <section className="app-card p-4">
          <div className="space-y-2">
            {state.residents.map((resident) => (
              <button className="w-full rounded-lg border border-[#ded0f2] bg-white p-3 text-left hover:border-[#6d4cc2]" key={resident.id} onClick={() => dispatch({ type: 'selectResident', residentId: resident.id })} type="button">
                <p className="font-black">{resident.name}</p>
                <p className="text-sm text-[#74638d]">Room {resident.room} · {resident.careArea}</p>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="app-card p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusPill>{selected.careArea}</StatusPill>
                <h2 className="mt-3 text-2xl font-black">{selected.name}</h2>
                <p className="mt-1 text-sm text-[#74638d]">Room {selected.room} · Birthday {selected.birthday}</p>
              </div>
              <div className="rounded-lg bg-[#efe4ff] p-4 text-center">
                <Trophy className="mx-auto text-[#6d4cc2]" />
                <p className="mt-1 text-3xl font-black">{balance}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74638d]">Bingo points</p>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <button className="app-button app-button-primary" onClick={() => setIsBingoDialogOpen(true)} type="button"><Plus size={16} /> Attended bingo</button>
              <button className="app-button app-button-secondary" onClick={() => setIsActivityDialogOpen(true)} type="button"><ClipboardCheck size={16} /> Attended Activity</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white p-4">
                <h3 className="font-black">Preferences</h3>
                <p className="mt-2 text-sm leading-6 text-[#74638d]"><strong>Likes:</strong> {selected.interests.join(', ')}</p>
                <p className="mt-2 text-sm leading-6 text-[#74638d]"><strong>Avoid:</strong> {selected.dislikes.join(', ')}</p>
                <p className="mt-2 text-sm leading-6 text-[#74638d]">{selected.mobility}</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <h3 className="font-black">Bingo History</h3>
                <div className="mt-2 space-y-2">
                  {transactions.map((item) => (
                    <div className="flex justify-between gap-3 text-sm" key={item.id}>
                      <span className="text-[#74638d]">
                        {item.reason}
                        <span className="block text-xs text-[#9b8db0]">{formatEntryDate(item.createdAt)}</span>
                      </span>
                      <span className="font-black text-[#25183f]">{item.amount > 0 ? '+' : ''}{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-white p-4 md:col-span-2">
                <h3 className="font-black">Activity Attendance</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {activityAttendance.map((item) => (
                    <div className="rounded-lg border border-[#eadff7] p-3 text-sm" key={item.id}>
                      <p className="font-bold text-[#25183f]">{item.activityName}</p>
                      <p className="mt-1 text-xs text-[#9b8db0]">{formatEntryDate(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {isBingoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25183f]/35 px-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={submitBingoBucks}>
            <h2 className="text-xl font-black text-[#25183f]">Please enter today&apos;s Bingo Bucks</h2>
            <p className="mt-2 text-sm leading-6 text-[#74638d]">
              This will be saved for {selected.name} with the current date and time.
            </p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="bingo-bucks">
              Bingo Bucks
            </label>
            <input
              autoFocus
              className="app-input mt-2"
              id="bingo-bucks"
              inputMode="numeric"
              min="0"
              onChange={(event) => setBingoBucks(event.target.value)}
              placeholder="Enter amount"
              type="number"
              value={bingoBucks}
            />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsBingoDialogOpen(false)} type="button">
                Cancel
              </button>
              <button className="app-button app-button-primary" type="submit">
                Save Bingo Bucks
              </button>
            </div>
          </form>
        </div>
      )}

      {isActivityDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25183f]/35 px-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={submitActivityAttendance}>
            <h2 className="text-xl font-black text-[#25183f]">Enter the activity attended</h2>
            <p className="mt-2 text-sm leading-6 text-[#74638d]">
              This will be saved for {selected.name} with the current date and time.
            </p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="activity-attended">
              Activity
            </label>
            <input
              autoFocus
              className="app-input mt-2"
              id="activity-attended"
              onChange={(event) => setActivityName(event.target.value)}
              placeholder="Enter activity name"
              type="text"
              value={activityName}
            />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsActivityDialogOpen(false)} type="button">
                Cancel
              </button>
              <button className="app-button app-button-primary" type="submit">
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
