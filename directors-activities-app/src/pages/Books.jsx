import SectionHeader from '../components/SectionHeader';
import StatusPill from '../components/StatusPill';
import { useAppState } from '../state/appState';

export default function Books() {
  const { state } = useAppState();
  return (
    <>
      <SectionHeader eyebrow="Books" title="Amanda's Reference Shelf">
        Books remain part of the workspace because Spring may use them as care and activity references.
      </SectionHeader>
      <div className="page-grid">
        {state.books.map((book) => (
          <section className="app-card p-5" key={book.id}>
            <StatusPill>{book.status}</StatusPill>
            <h2 className="mt-3 text-lg font-black">{book.title}</h2>
            <p className="mt-1 text-sm text-[#74638d]">{book.author}</p>
            <p className="mt-4 text-sm font-bold text-[#6d4cc2]">{book.pages} pages</p>
          </section>
        ))}
      </div>
    </>
  );
}
