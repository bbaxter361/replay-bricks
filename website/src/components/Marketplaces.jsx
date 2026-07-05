import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

const REPLAY_STORE = {
  name: 'Replay Bricks Store',
  desc: "Shop directly from us — browse our complete inventory of LEGO sets, minifigures, and parts right here on our own store. Click to browse our inventory.",
  url: '/shop',
  color: '#FFD700',
  gradient: 'from-yellow-400 to-amber-600',
  bg: 'bg-yellow-400/5',
  border: 'border-yellow-400/30 hover:border-yellow-400/60 ring-1 ring-yellow-400/10',
  icon: (
    <svg viewBox="0 0 64 64" className="w-20 h-20" fill="none">
      <rect x="4" y="20" width="56" height="38" rx="4" stroke="#FFD700" strokeWidth="2.5"/>
      <rect x="18" y="8" width="28" height="12" rx="3" fill="#FFD700" opacity="0.3" stroke="#FFD700" strokeWidth="2"/>
      <text x="32" y="44" textAnchor="middle" fill="#FFD700" fontSize="16" fontWeight="bold">RB</text>
    </svg>
  ),
};

const MARKETPLACES = [
  {
    name: 'BrickLink',
    desc: "The world's largest LEGO marketplace. Shop our complete inventory of sets, minifigures, and parts.",
    url: 'https://store.bricklink.com/replay1138#/shop',
    username: '@ReplayBricks',
    color: '#1E90FF',
    gradient: 'from-blue-600 to-blue-800',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <rect x="6" y="12" width="52" height="40" rx="5" stroke="#1E90FF" strokeWidth="2.5"/>
        <circle cx="16" cy="24" r="3.5" fill="#1E90FF"/>
        <circle cx="28" cy="24" r="3.5" fill="#1E90FF"/>
        <circle cx="40" cy="24" r="3.5" fill="#1E90FF"/>
        <circle cx="52" cy="24" r="3.5" fill="#1E90FF"/>
        <circle cx="16" cy="38" r="3.5" fill="#1E90FF"/>
        <circle cx="28" cy="38" r="3.5" fill="#1E90FF"/>
        <circle cx="40" cy="38" r="3.5" fill="#1E90FF"/>
        <circle cx="52" cy="38" r="3.5" fill="#1E90FF"/>
      </svg>
    ),
  },
  {
    name: 'Brick Owl',
    desc: 'Another trusted LEGO marketplace with a great community. Find our full catalog here too.',
    url: 'https://replaybricks.brickowl.com/',
    username: '@ReplayBricks',
    color: '#FF8C00',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <circle cx="22" cy="22" r="16" stroke="#FF8C00" strokeWidth="2.5"/>
        <circle cx="42" cy="22" r="16" stroke="#FF8C00" strokeWidth="2.5"/>
        <circle cx="22" cy="22" r="4" fill="#FF8C00" opacity="0.3"/>
        <circle cx="42" cy="22" r="4" fill="#FF8C00" opacity="0.3"/>
      </svg>
    ),
  },
];

export default function Marketplaces() {
  return (
    <Section id="marketplaces" className="section-dark">
      <SectionHeading
        label="Where to Buy"
        title="Find Us Online"
        subtitle="We maintain active storefronts on the most trusted LEGO marketplaces. Click through to browse our inventory."
      />

      {/* Replay Bricks Store — full width, on top */}
      <div className="max-w-4xl mx-auto mb-6">
        <ScrollReveal>
          <a
            href={REPLAY_STORE.url}
            className={`block group relative ${REPLAY_STORE.bg} border ${REPLAY_STORE.border} rounded-2xl p-8 md:p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-xl`}
          >
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${REPLAY_STORE.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="flex-shrink-0">{REPLAY_STORE.icon}</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{REPLAY_STORE.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">{REPLAY_STORE.desc}</p>
              </div>
              <div className="md:ml-auto flex-shrink-0">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-lg transition-colors text-sm">
                  Shop Now →
                </span>
              </div>
            </div>
          </a>
        </ScrollReveal>
      </div>

      {/* BrickLink + BrickOwl — two columns underneath */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {MARKETPLACES.map((mp, i) => (
          <ScrollReveal key={mp.name} delay={0.15 * i}>
            <a
              href={mp.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block group relative ${mp.bg} border ${mp.border} rounded-2xl p-6 md:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mp.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4">{mp.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{mp.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{mp.desc}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
                  <span>{mp.username}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
