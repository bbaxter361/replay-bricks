import { FileDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';
import { buildCanvaPlaceholderPayload } from '../utils/canvaTemplates';

const exportTypes = ['daily', 'weekly', 'monthly'];

export default function CanvaExports() {
  const { state, dispatch } = useAppState();
  const [selectedTemplates, setSelectedTemplates] = useState(() =>
    Object.fromEntries(exportTypes.map((type) => [type, state.canvaTemplates.find((template) => template.type === type)?.id])),
  );
  const payload = useMemo(
    () => buildCanvaPlaceholderPayload({
      calendarTitle: 'Memory Care Daily Activities',
      view: 'daily',
      events: state.calendarEvents.map((event) => ({
        date: event.start.slice(0, 10),
        day: new Date(event.start).toLocaleDateString([], { weekday: 'long' }),
        time: new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        title: event.title,
        location: event.location,
        description: event.description,
        wing: event.wing,
        supplies: event.supplies,
      })),
    }),
    [state.calendarEvents],
  );

  return (
    <>
      <SectionHeader eyebrow="Canva" title="Daily, Weekly, Monthly Calendar Export">
        Amanda can keep multiple Canva templates and choose defaults. This preview shows the named placeholder strategy.
      </SectionHeader>

      <div className="page-grid">
        {exportTypes.map((type) => (
          <section className="app-card p-5" key={type}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a6fc4]">{type}</p>
                <h2 className="mt-1 text-xl font-black capitalize">{type} export</h2>
              </div>
              <StatusPill tone="green">Canva</StatusPill>
            </div>
            <select className="app-input mt-4" onChange={(event) => setSelectedTemplates((prev) => ({ ...prev, [type]: event.target.value }))} value={selectedTemplates[type] || ''}>
              {state.canvaTemplates.filter((template) => template.type === type).map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <button className="app-button app-button-primary mt-4 w-full" onClick={() => dispatch({ type: 'prepareCanvaExport', exportType: type, templateId: selectedTemplates[type] })} type="button">
              <FileDown size={16} />
              Prepare Canva Export
            </button>
          </section>
        ))}
      </div>

      <section className="app-card mt-4 p-5">
        <h2 className="text-lg font-black">Named Placeholder Preview</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {Object.entries(payload.events[0] || {}).map(([key, value]) => (
            <div className="rounded-lg bg-white p-3 text-sm" key={key}>
              <span className="font-black text-[#6d4cc2]">{`{{${key}}}`}</span>
              <span className="ml-2 text-[#74638d]">{value}</span>
            </div>
          ))}
        </div>
        {state.canvaExportPreview && <p className="mt-4 text-sm font-bold text-[#2e6f68]">Preview ready for {state.canvaExportPreview.type} export.</p>}
      </section>
    </>
  );
}
