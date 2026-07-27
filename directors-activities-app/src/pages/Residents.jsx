import { ArrowLeft, ClipboardCheck, Download, MessageSquareText, Plus, Save, Trash2, Trophy, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { selectBingoBalance, useAppState } from '../state/appState';
import { buildOneOnOneDoc } from '../utils/residentRecords';

export default function Residents() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const { residentId: routeResidentId } = useParams();
  const [isBingoDialogOpen, setIsBingoDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isOneOnOneDialogOpen, setIsOneOnOneDialogOpen] = useState(false);
  const [bingoBucks, setBingoBucks] = useState('');
  const [activityName, setActivityName] = useState('');
  const [oneOnOneNotes, setOneOnOneNotes] = useState('');
  const [familyForm, setFamilyForm] = useState({ name: '', relationship: '', phone: '', email: '' });

  const routeResident = state.residents.find((resident) => resident.id === routeResidentId);
  const selected = routeResident || state.residents.find((resident) => resident.id === state.selectedResidentId) || state.residents[0];
  const balance = selected ? selectBingoBalance(state, selected.id) : 0;
  const transactions = state.bingoTransactions.filter((item) => item.residentId === selected?.id);
  const activityAttendance = (state.residentActivityAttendance || []).filter((item) => item.residentId === selected?.id);
  const residentOneOnOneNotes = (state.oneOnOneNotes || []).filter((item) => item.residentId === selected?.id).slice().reverse();
  const familyContacts = state.contacts.filter((contact) => contact.residentId === selected?.id);

  useEffect(() => {
    if (routeResident?.id && routeResident.id !== state.selectedResidentId) {
      dispatch({ type: 'selectResident', residentId: routeResident.id });
    }
  }, [dispatch, routeResident?.id, state.selectedResidentId]);

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

  const submitOneOnOneNotes = (event) => {
    event.preventDefault();
    const notes = oneOnOneNotes.trim();
    if (!notes) return;

    dispatch({
      type: 'addOneOnOneNote',
      note: {
        residentId: selected.id,
        notes,
        createdAt: new Date().toISOString(),
      },
    });
    setOneOnOneNotes('');
    setIsOneOnOneDialogOpen(false);
  };

  const updateFamilyForm = (field, value) => {
    setFamilyForm((current) => ({ ...current, [field]: value }));
  };

  const submitProfile = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    dispatch({
      type: 'updateResidentProfile',
      residentId: selected.id,
      updates: {
        name: formData.get('name'),
        room: formData.get('room'),
        careArea: formData.get('careArea'),
        birthday: formData.get('birthday'),
        interests: formData.get('interests'),
        dislikes: formData.get('dislikes'),
        mobility: formData.get('mobility'),
        cognition: formData.get('cognition'),
        notes: formData.get('notes'),
        photo: formData.get('photo'),
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const submitFamilyContact = (event) => {
    event.preventDefault();
    const name = familyForm.name.trim();
    if (!name) return;

    dispatch({
      type: 'addFamilyContact',
      contact: {
        residentId: selected.id,
        name,
        relationship: familyForm.relationship,
        phone: familyForm.phone,
        email: familyForm.email,
        createdAt: new Date().toISOString(),
      },
    });
    setFamilyForm({ name: '', relationship: '', phone: '', email: '' });
  };

  const openResidentProfile = (residentId) => {
    dispatch({ type: 'selectResident', residentId });
    navigate(`/app/residents/${residentId}`);
  };

  const exportOneOnOneDoc = () => {
    const doc = buildOneOnOneDoc(selected, residentOneOnOneNotes.slice().reverse());
    const blob = new Blob([doc.content], { type: doc.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    link.click();
    URL.revokeObjectURL(url);
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
      <SectionHeader eyebrow="Residents" title="Resident Information">
        Resident profiles give Spring the context to choose better activities and help Amanda see who needs attention.
      </SectionHeader>

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <section className={`app-card p-4 ${routeResidentId ? 'hidden xl:block' : ''}`}>
          <div className="space-y-2">
            {state.residents.map((resident) => (
              <button
                className={`w-full rounded-lg border bg-white p-3 text-left hover:border-[#6d4cc2] ${selected?.id === resident.id ? 'border-[#6d4cc2]' : 'border-[#ded0f2]'}`}
                key={resident.id}
                onClick={() => openResidentProfile(resident.id)}
                type="button"
              >
                <p className="font-black">{resident.name}</p>
                <p className="text-sm text-[#74638d]">Room {resident.room || 'not set'} · {resident.careArea || 'care area not set'}</p>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="app-card p-4 md:p-5">
            {routeResidentId && (
              <button className="app-button app-button-secondary mb-4 xl:hidden" onClick={() => navigate('/app/residents')} type="button">
                <ArrowLeft size={16} /> Residents
              </button>
            )}

            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusPill>{selected.careArea || 'resident'}</StatusPill>
                <h2 className="mt-3 text-2xl font-black">{selected.name}</h2>
                <p className="mt-1 text-sm text-[#74638d]">Room {selected.room || 'not set'} · Birthday {selected.birthday || 'not set'}</p>
              </div>
              <div className="rounded-lg bg-[#efe4ff] p-4 text-center">
                <Trophy className="mx-auto text-[#6d4cc2]" />
                <p className="mt-1 text-3xl font-black">{balance}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74638d]">Bingo Bucks</p>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <button className="app-button app-button-primary" onClick={() => setIsBingoDialogOpen(true)} type="button"><Plus size={16} /> Attended bingo</button>
              <button className="app-button app-button-secondary" onClick={() => setIsActivityDialogOpen(true)} type="button"><ClipboardCheck size={16} /> Attended Activity</button>
              <button className="app-button app-button-secondary" onClick={() => setIsOneOnOneDialogOpen(true)} type="button"><MessageSquareText size={16} /> 1 on 1</button>
            </div>

            <form className="rounded-lg bg-white p-4" key={selected.id} onSubmit={submitProfile}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-black">Editable Profile</h3>
                <button className="app-button app-button-primary" type="submit"><Save size={16} /> Save profile</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-bold text-[#5a4873]">
                  Name
                  <input className="app-input mt-1" defaultValue={selected.name} name="name" type="text" />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Room
                  <input className="app-input mt-1" defaultValue={selected.room} name="room" type="text" />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Care area
                  <select className="app-input mt-1" defaultValue={selected.careArea} name="careArea">
                    <option value="">Choose care area</option>
                    <option value="assisted">Assisted Living</option>
                    <option value="memory">Memory Care</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Birthday
                  <input className="app-input mt-1" defaultValue={selected.birthday} name="birthday" type="text" />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Likes
                  <input className="app-input mt-1" defaultValue={(selected.interests || []).join(', ')} name="interests" placeholder="bingo, music, crafts" type="text" />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Avoid
                  <input className="app-input mt-1" defaultValue={(selected.dislikes || []).join(', ')} name="dislikes" placeholder="loud rooms, early mornings" type="text" />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Mobility
                  <textarea className="app-input mt-1 min-h-24" defaultValue={selected.mobility} name="mobility" />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Cognition
                  <textarea className="app-input mt-1 min-h-24" defaultValue={selected.cognition} name="cognition" />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Notes
                  <textarea className="app-input mt-1 min-h-28" defaultValue={selected.notes} name="notes" />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Photo
                  <input className="app-input mt-1" defaultValue={selected.photo} name="photo" placeholder="Photo URL or file note" type="text" />
                </label>
              </div>
            </form>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
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

              <div className="rounded-lg bg-white p-4">
                <h3 className="font-black">Activity Attendance</h3>
                <div className="mt-2 grid gap-2">
                  {activityAttendance.map((item) => (
                    <div className="rounded-lg border border-[#eadff7] p-3 text-sm" key={item.id}>
                      <p className="font-bold text-[#25183f]">{item.activityName}</p>
                      <p className="mt-1 text-xs text-[#9b8db0]">{formatEntryDate(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black">1 on 1 Notes</h3>
                  <button className="app-button app-button-secondary" onClick={exportOneOnOneDoc} type="button"><Download size={16} /> Export DOC</button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {residentOneOnOneNotes.map((item) => (
                    <div className="rounded-lg border border-[#eadff7] p-3 text-sm" key={item.id}>
                      <p className="text-[#74638d]">{item.notes}</p>
                      <p className="mt-2 text-xs text-[#9b8db0]">{formatEntryDate(item.createdAt)} · {item.createdBy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black">Family of Residents</h3>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9b8db0]">New resident paperwork</span>
                </div>
                <form className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4" onSubmit={submitFamilyContact}>
                  <input className="app-input" onChange={(event) => updateFamilyForm('name', event.target.value)} placeholder="Family member name" type="text" value={familyForm.name} />
                  <input className="app-input" onChange={(event) => updateFamilyForm('relationship', event.target.value)} placeholder="Relationship" type="text" value={familyForm.relationship} />
                  <input className="app-input" onChange={(event) => updateFamilyForm('phone', event.target.value)} placeholder="Phone" type="tel" value={familyForm.phone} />
                  <div className="flex gap-2">
                    <input className="app-input" onChange={(event) => updateFamilyForm('email', event.target.value)} placeholder="Email" type="email" value={familyForm.email} />
                    <button className="app-button app-button-primary shrink-0" type="submit"><UserPlus size={16} /> Add</button>
                  </div>
                </form>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {familyContacts.map((contact) => (
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#eadff7] p-3 text-sm" key={contact.id}>
                      <div>
                        <p className="font-bold text-[#25183f]">{contact.name}</p>
                        <p className="mt-1 text-[#74638d]">{contact.relationship || 'Family'}</p>
                        <p className="mt-2 text-xs text-[#9b8db0]">{contact.phone}</p>
                        <p className="text-xs text-[#9b8db0]">{contact.email}</p>
                      </div>
                      <button aria-label={`Delete ${contact.name}`} className="app-button app-button-secondary min-w-10 px-2" onClick={() => dispatch({ type: 'deleteFamilyContact', contactId: contact.id })} type="button">
                        <Trash2 size={16} />
                      </button>
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
            <p className="mt-2 text-sm leading-6 text-[#74638d]">This will be saved for {selected.name} with the current date and time.</p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="bingo-bucks">Bingo Bucks</label>
            <input autoFocus className="app-input mt-2" id="bingo-bucks" inputMode="numeric" min="0" onChange={(event) => setBingoBucks(event.target.value)} placeholder="Enter amount" type="number" value={bingoBucks} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsBingoDialogOpen(false)} type="button">Cancel</button>
              <button className="app-button app-button-primary" type="submit">Save Bingo Bucks</button>
            </div>
          </form>
        </div>
      )}

      {isActivityDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25183f]/35 px-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={submitActivityAttendance}>
            <h2 className="text-xl font-black text-[#25183f]">Enter the activity attended</h2>
            <p className="mt-2 text-sm leading-6 text-[#74638d]">This will be saved for {selected.name} with the current date and time.</p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="activity-attended">Activity</label>
            <input autoFocus className="app-input mt-2" id="activity-attended" onChange={(event) => setActivityName(event.target.value)} placeholder="Enter activity name" type="text" value={activityName} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsActivityDialogOpen(false)} type="button">Cancel</button>
              <button className="app-button app-button-primary" type="submit">Save Activity</button>
            </div>
          </form>
        </div>
      )}

      {isOneOnOneDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25183f]/35 px-4">
          <form className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl" onSubmit={submitOneOnOneNotes}>
            <h2 className="text-xl font-black text-[#25183f]">1 on 1 Notes</h2>
            <p className="mt-2 text-sm leading-6 text-[#74638d]">This interview note will be saved for {selected.name} with the current date and time.</p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="one-on-one-notes">Notes</label>
            <textarea autoFocus className="app-input mt-2 min-h-40" id="one-on-one-notes" onChange={(event) => setOneOnOneNotes(event.target.value)} placeholder="Enter 1 on 1 notes" value={oneOnOneNotes} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsOneOnOneDialogOpen(false)} type="button">Cancel</button>
              <button className="app-button app-button-primary" type="submit">Save 1 on 1</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
