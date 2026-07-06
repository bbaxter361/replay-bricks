import SectionHeader from '../components/SectionHeader';
import { useAppState } from '../state/appState';

export default function Contacts() {
  const { state } = useAppState();
  return (
    <>
      <SectionHeader eyebrow="Contacts" title="Family, Staff, And Care Contacts">
        Contacts stay inside the same app so Spring can connect residents, families, and planning notes.
      </SectionHeader>
      <div className="page-grid">
        {state.contacts.map((contact) => (
          <section className="app-card p-5" key={contact.id}>
            <h2 className="text-lg font-black">{contact.name}</h2>
            <p className="mt-1 text-sm text-[#74638d]">{contact.relationship}</p>
            <p className="mt-4 text-sm text-[#74638d]">{contact.phone}</p>
            <p className="text-sm text-[#74638d]">{contact.email}</p>
          </section>
        ))}
      </div>
    </>
  );
}
