import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

export default function Settings() {
  const { state } = useAppState();
  return (
    <>
      <SectionHeader eyebrow="Settings" title="Preview Safety And Future Wiring">
        This local preview does not delete or overwrite Amanda's current data. Supabase, Canva, Spring AI, and Obsidian indexing come after review.
      </SectionHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="app-card p-5">
          <StatusPill tone="green">local preview</StatusPill>
          <h2 className="mt-3 text-lg font-black">Data boundary</h2>
          <p className="mt-2 text-sm leading-6 text-[#74638d]">Current state is stored locally in this browser only. The next phase replaces this boundary with Supabase auth, database, and storage.</p>
        </section>
        <section className="app-card p-5">
          <StatusPill tone="gold">archive</StatusPill>
          <h2 className="mt-3 text-lg font-black">Obsidian brain</h2>
          <p className="mt-2 text-sm leading-6 text-[#74638d]">C:\Users\bbaxt\obsidian-vault</p>
          <p className="mt-2 text-sm leading-6 text-[#74638d]">Obsidian remains the readable archive and backup brain.</p>
        </section>
        <section className="app-card p-5 lg:col-span-2">
          <h2 className="text-lg font-black">Canva defaults</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {state.canvaTemplates.map((template) => (
              <div className="rounded-lg bg-white p-3" key={template.id}>
                <p className="font-bold">{template.name}</p>
                <p className="text-sm text-[#74638d]">{template.type}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
