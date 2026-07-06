import { Blocks, Trophy } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

export default function Games() {
  return (
    <>
      <SectionHeader eyebrow="Games" title="Games Stay Inside The App">
        These are listed here so we can build each game into Amanda's workflow one at a time.
      </SectionHeader>
      <div className="page-grid">
        <section className="app-card p-5">
          <Trophy className="text-[#6d4cc2]" />
          <h2 className="mt-4 text-xl font-black">Bingo Caller</h2>
          <p className="mt-2 text-sm leading-6 text-[#74638d]">Keep Bingo Bucks tied to resident profiles.</p>
          <button className="app-button app-button-secondary mt-4" disabled type="button">Build next</button>
        </section>
        <section className="app-card p-5">
          <Blocks className="text-[#6d4cc2]" />
          <h2 className="mt-4 text-xl font-black">Memory Care Games</h2>
          <p className="mt-2 text-sm leading-6 text-[#74638d]">Family Feud style games and other group activities can be rebuilt here later.</p>
          <button className="app-button app-button-secondary mt-4" disabled type="button">Build next</button>
        </section>
      </div>
    </>
  );
}
