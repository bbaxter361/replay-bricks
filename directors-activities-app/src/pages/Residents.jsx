import { Gift, Minus, Plus, Trophy } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { selectBingoBalance, useAppState } from '../state/appState';

export default function Residents() {
  const { state, dispatch } = useAppState();
  const selected = state.residents.find((resident) => resident.id === state.selectedResidentId) || state.residents[0];
  const balance = selected ? selectBingoBalance(state, selected.id) : 0;
  const transactions = state.bingoTransactions.filter((item) => item.residentId === selected?.id);

  const addPoints = (amount, reason) => {
    dispatch({ type: 'addBingoTransaction', transaction: { residentId: selected.id, amount, reason } });
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
              <button className="app-button app-button-primary" onClick={() => addPoints(5, 'Attended bingo')} type="button"><Plus size={16} /> Attended bingo</button>
              <button className="app-button app-button-secondary" onClick={() => addPoints(1, 'Manual add')} type="button"><Plus size={16} /> Add 1</button>
              <button className="app-button app-button-secondary" onClick={() => addPoints(-1, 'Manual subtract')} type="button"><Minus size={16} /> Subtract 1</button>
              <button className="app-button app-button-secondary" onClick={() => addPoints(-5, 'Redeemed prize')} type="button"><Gift size={16} /> Redeem prize</button>
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
                      <span className="text-[#74638d]">{item.reason}</span>
                      <span className="font-black text-[#25183f]">{item.amount > 0 ? '+' : ''}{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
