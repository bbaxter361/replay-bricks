import { CalendarPlus, CheckCircle2, FilePlus2 } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

export default function Activities() {
  const { state, dispatch } = useAppState();
  const [mode, setMode] = useState('approved');
  const records = mode === 'approved' ? state.activities : state.activityDrafts;
  const selected = records.find((item) => item.id === (mode === 'approved' ? state.selectedActivityId : records[0]?.id)) || records[0];

  return (
    <>
      <SectionHeader
        eyebrow="Activities"
        title="Reusable Activity Library"
        actions={<button className="app-button app-button-primary" onClick={() => dispatch({ type: 'createActivityDraft', title: 'New scanned activity', source: { type: 'scan', label: 'Phone scan or upload' } })} type="button"><FilePlus2 size={16} /> New draft</button>}
      >
        Websites, scans, and uploaded files become drafts first. Amanda approves before they become official activities.
      </SectionHeader>

      <div className="mb-4 flex gap-2">
        <button className={`app-button ${mode === 'approved' ? 'app-button-primary' : 'app-button-secondary'}`} onClick={() => setMode('approved')} type="button">Approved</button>
        <button className={`app-button ${mode === 'drafts' ? 'app-button-primary' : 'app-button-secondary'}`} onClick={() => setMode('drafts')} type="button">Drafts</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <section className="app-card p-4">
          <div className="space-y-2">
            {records.map((activity) => (
              <button className="w-full rounded-lg border border-[#ded0f2] bg-white p-3 text-left hover:border-[#6d4cc2]" key={activity.id} onClick={() => dispatch({ type: 'selectActivity', activityId: activity.id })} type="button">
                <p className="font-black">{activity.title}</p>
                <p className="text-sm text-[#74638d]">{activity.category} · {activity.durationMinutes} min</p>
              </button>
            ))}
          </div>
        </section>

        <section className="app-card p-5">
          {selected && (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusPill tone={selected.status === 'draft' ? 'gold' : 'green'}>{selected.status}</StatusPill>
                  <h2 className="mt-3 text-2xl font-black">{selected.title}</h2>
                  <p className="mt-1 text-sm text-[#74638d]">{selected.category} · best for {selected.bestFor}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'draft' && (
                    <button className="app-button app-button-primary" onClick={() => dispatch({ type: 'approveActivityDraft', draftId: selected.id })} type="button"><CheckCircle2 size={16} /> Approve & Save</button>
                  )}
                  {selected.status !== 'draft' && (
                    <button className="app-button app-button-secondary" onClick={() => dispatch({ type: 'scheduleActivity', activityId: selected.id })} type="button"><CalendarPlus size={16} /> Schedule</button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-black">Supplies</h3>
                  <ul className="mt-2 list-inside list-disc text-sm leading-7 text-[#74638d]">
                    {(selected.supplies || []).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-black">Steps</h3>
                  <ol className="mt-2 list-inside list-decimal text-sm leading-7 text-[#74638d]">
                    {(selected.steps || []).map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-[#efe4ff] p-4 text-sm leading-6 text-[#5a4873]">
                <p><strong>Safety:</strong> {selected.safetyNotes || 'Review before use.'}</p>
                <p className="mt-2"><strong>Dementia adaptation:</strong> {selected.dementiaAdaptations || 'Add notes during review.'}</p>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
