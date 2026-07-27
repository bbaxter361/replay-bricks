import { CalendarPlus, CheckCircle2, FilePlus2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

function activityToForm(activity = {}) {
  return {
    title: activity.title || '',
    category: activity.category || '',
    bestFor: activity.bestFor || 'both',
    difficulty: activity.difficulty || 'easy',
    durationMinutes: activity.durationMinutes || 45,
    groupSize: activity.groupSize || '',
    supplies: (activity.supplies || []).join(', '),
    steps: (activity.steps || []).join('\n'),
    safetyNotes: activity.safetyNotes || '',
    dementiaAdaptations: activity.dementiaAdaptations || '',
    tags: (activity.tags || []).join(', '),
    residentNotes: activity.residentNotes || '',
    sourceLabel: activity.source?.label || '',
  };
}

export default function Activities() {
  const { state, dispatch } = useAppState();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('view') === 'drafts' ? 'drafts' : 'approved');
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({ title: '', sourceLabel: '' });
  const records = mode === 'approved' ? state.activities : state.activityDrafts;
  const selected = records.find((item) => item.id === state.selectedActivityId) || records[0];
  const [editState, setEditState] = useState({ recordId: null, values: {} });
  const editForm = selected && editState.recordId === selected.id ? editState.values : activityToForm(selected);

  const updateEditForm = (field, value) => {
    setEditState((current) => ({
      recordId: selected?.id || null,
      values: {
        ...(current.recordId === selected?.id ? current.values : activityToForm(selected)),
        [field]: value,
      },
    }));
  };

  const saveActivity = (event) => {
    event.preventDefault();
    if (!selected) return;
    const recordType = selected.status === 'draft' ? 'activityDraft' : 'activity';
    dispatch({
      type: 'updateActivityRecord',
      recordType,
      recordId: selected.id,
      updates: {
        ...editForm,
        source: { ...(selected.source || {}), label: editForm.sourceLabel || selected.source?.label || 'Manual entry' },
      },
      audit: {
        requestedBy: state.currentUser?.name || 'Amanda',
        recordType,
        recordId: selected.id,
        action: 'update',
        changes: editForm,
      },
    });
  };

  const submitDraft = (event) => {
    event.preventDefault();
    const title = draftForm.title.trim();
    if (!title) return;

    dispatch({
      type: 'createActivityDraft',
      title,
      source: { type: 'manual', label: draftForm.sourceLabel.trim() || 'Manual entry' },
    });
    setDraftForm({ title: '', sourceLabel: '' });
    setMode('drafts');
    setIsDraftDialogOpen(false);
  };

  const deleteActivity = (event, activity) => {
    event.stopPropagation();
    const confirmed = window.confirm(`Delete "${activity.title}" from ${mode === 'drafts' ? 'drafts' : 'the Activities Library'}?`);
    if (!confirmed) return;
    const recordType = activity.status === 'draft' || mode === 'drafts' ? 'activityDraft' : 'activity';
    dispatch({
      type: 'deleteActivityRecord',
      recordType,
      recordId: activity.id,
      audit: {
        requestedBy: state.currentUser?.name || 'Amanda',
        recordType,
        recordId: activity.id,
        action: 'delete',
        changes: { title: activity.title },
      },
    });
  };

  return (
    <>
      <SectionHeader
        eyebrow="Activities"
        title="Activities Library"
        actions={<button className="app-button app-button-primary" onClick={() => setIsDraftDialogOpen(true)} type="button"><FilePlus2 size={16} /> New draft</button>}
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
              <div className="rounded-lg border border-[#ded0f2] bg-white p-3 hover:border-[#6d4cc2]" key={activity.id}>
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => dispatch({ type: 'selectActivity', activityId: activity.id })} type="button">
                    <span className="block font-black">{activity.title}</span>
                    <span className="text-sm text-[#74638d]">{activity.category} · {activity.durationMinutes} min</span>
                  </button>
                  <button
                    aria-label={`Delete ${activity.title}`}
                    className="app-button app-button-secondary min-w-10 px-2"
                    onClick={(event) => deleteActivity(event, activity)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-card p-5">
          {selected && (
            <form onSubmit={saveActivity}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusPill tone={selected.status === 'draft' ? 'gold' : 'green'}>{selected.status}</StatusPill>
                  <h2 className="mt-3 text-2xl font-black">Edit Activity File</h2>
                  <p className="mt-1 text-sm text-[#74638d]">Every field below saves back to the Activities Library.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'draft' && (
                    <button className="app-button app-button-primary" onClick={() => dispatch({ type: 'approveActivityDraft', draftId: selected.id })} type="button"><CheckCircle2 size={16} /> Approve & Save</button>
                  )}
                  {selected.status !== 'draft' && (
                    <button className="app-button app-button-secondary" onClick={() => dispatch({ type: 'scheduleActivity', activityId: selected.id })} type="button"><CalendarPlus size={16} /> Schedule</button>
                  )}
                  <button className="app-button app-button-secondary" onClick={(event) => deleteActivity(event, selected)} type="button"><Trash2 size={16} /> Delete</button>
                  <button className="app-button app-button-primary" type="submit">Save Updates</button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-bold text-[#5a4873]">
                  Title
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('title', event.target.value)} value={editForm.title} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Category
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('category', event.target.value)} value={editForm.category} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Best for
                  <select className="app-input mt-1" onChange={(event) => updateEditForm('bestFor', event.target.value)} value={editForm.bestFor}>
                    <option value="both">Both</option>
                    <option value="memory">Memory care</option>
                    <option value="assisted">Assisted living</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Difficulty
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('difficulty', event.target.value)} value={editForm.difficulty} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Duration minutes
                  <input className="app-input mt-1" min="1" onChange={(event) => updateEditForm('durationMinutes', event.target.value)} type="number" value={editForm.durationMinutes} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Group size
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('groupSize', event.target.value)} value={editForm.groupSize} />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Supplies
                  <textarea className="app-input mt-1 min-h-20" onChange={(event) => updateEditForm('supplies', event.target.value)} value={editForm.supplies} />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Steps
                  <textarea className="app-input mt-1 min-h-32" onChange={(event) => updateEditForm('steps', event.target.value)} value={editForm.steps} />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Safety notes
                  <textarea className="app-input mt-1 min-h-20" onChange={(event) => updateEditForm('safetyNotes', event.target.value)} value={editForm.safetyNotes} />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Dementia adaptation
                  <textarea className="app-input mt-1 min-h-20" onChange={(event) => updateEditForm('dementiaAdaptations', event.target.value)} value={editForm.dementiaAdaptations} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Tags
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('tags', event.target.value)} value={editForm.tags} />
                </label>
                <label className="text-sm font-bold text-[#5a4873]">
                  Source
                  <input className="app-input mt-1" onChange={(event) => updateEditForm('sourceLabel', event.target.value)} value={editForm.sourceLabel} />
                </label>
                <label className="text-sm font-bold text-[#5a4873] md:col-span-2">
                  Resident notes
                  <textarea className="app-input mt-1 min-h-20" onChange={(event) => updateEditForm('residentNotes', event.target.value)} value={editForm.residentNotes} />
                </label>
              </div>
            </form>
          )}
        </section>
      </div>

      {isDraftDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25183f]/35 px-4">
          <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl" onSubmit={submitDraft}>
            <h2 className="text-xl font-black text-[#25183f]">Create Activity Draft</h2>
            <p className="mt-2 text-sm leading-6 text-[#74638d]">
              Amanda can start the draft here, then Spring can help fill in the full activity file.
            </p>
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="draft-title">
              Activity title
            </label>
            <input
              autoFocus
              className="app-input mt-2"
              id="draft-title"
              onChange={(event) => setDraftForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Enter activity title"
              type="text"
              value={draftForm.title}
            />
            <label className="mt-4 block text-sm font-bold text-[#5a4873]" htmlFor="draft-source">
              Source or website
            </label>
            <input
              className="app-input mt-2"
              id="draft-source"
              onChange={(event) => setDraftForm((current) => ({ ...current, sourceLabel: event.target.value }))}
              placeholder="Paste a website or note"
              type="text"
              value={draftForm.sourceLabel}
            />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="app-button app-button-secondary" onClick={() => setIsDraftDialogOpen(false)} type="button">
                Cancel
              </button>
              <button className="app-button app-button-primary" type="submit">
                Save Draft
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
