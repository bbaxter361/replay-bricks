import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { calendarEventToForm } from '../utils/calendarEvents.js';

export default function CalendarEventEditor({ event, onClose, onDelete, onSave }) {
  const [form, setForm] = useState(() => calendarEventToForm(event));

  useEffect(() => {
    setForm(calendarEventToForm(event));
  }, [event]);

  if (!event) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = (submitEvent) => {
    submitEvent.preventDefault();
    onSave(event.id, form);
  };

  const remove = () => {
    if (window.confirm(`Delete "${event.title}" from the calendar?`)) {
      onDelete(event.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#25183f]/45 p-3 sm:items-center sm:justify-center">
      <form className="max-h-[92dvh] w-full overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:max-w-2xl" onSubmit={save}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#74638d]">Calendar Activity</p>
            <h2 className="text-xl font-black text-[#25183f]">Edit Activity</h2>
          </div>
          <button aria-label="Close editor" className="app-button app-button-secondary px-3" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2 text-sm font-bold text-[#5a4873]">
            Activity name
            <input className="app-input mt-1" onChange={(item) => updateField('title', item.target.value)} value={form.title} />
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            Date
            <input className="app-input mt-1" onChange={(item) => updateField('date', item.target.value)} type="date" value={form.date} />
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            Location
            <input className="app-input mt-1" onChange={(item) => updateField('location', item.target.value)} value={form.location} />
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            Start time
            <input className="app-input mt-1" onChange={(item) => updateField('startTime', item.target.value)} type="time" value={form.startTime} />
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            End time
            <input className="app-input mt-1" onChange={(item) => updateField('endTime', item.target.value)} type="time" value={form.endTime} />
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            Wing
            <select className="app-input mt-1" onChange={(item) => updateField('wing', item.target.value)} value={form.wing}>
              <option value="both">Both</option>
              <option value="memory">Memory care</option>
              <option value="assisted">Assisted living</option>
            </select>
          </label>
          <label className="text-sm font-bold text-[#5a4873]">
            Staff
            <input className="app-input mt-1" onChange={(item) => updateField('assignedStaff', item.target.value)} value={form.assignedStaff} />
          </label>
          <label className="md:col-span-2 text-sm font-bold text-[#5a4873]">
            Supplies
            <input className="app-input mt-1" onChange={(item) => updateField('supplies', item.target.value)} value={form.supplies} />
          </label>
          <label className="md:col-span-2 text-sm font-bold text-[#5a4873]">
            Notes
            <textarea className="app-input mt-1 min-h-28" onChange={(item) => updateField('description', item.target.value)} value={form.description} />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button className="app-button app-button-secondary text-[#9f1d35]" onClick={remove} type="button">
            <Trash2 size={16} /> Delete
          </button>
          <div className="flex gap-2">
            <button className="app-button app-button-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="app-button app-button-primary" type="submit">Save Changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
