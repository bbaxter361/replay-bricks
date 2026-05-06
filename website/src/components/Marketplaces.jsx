import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

const MARKETPLACES = [
  {
    name: 'BrickLink',
    desc: 'The world\'s largest LEGO marketplace. Shop our complete inventory of sets, minifigures, and parts.',
    url: 'https://www.bricklink.com',
    username: '@ReplayBricks',
    color: '#E3000B',
    gradient: 'from-red-600 to-red-800',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20 hover:border-red-500/40',
    icon: (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <rect x="6" y="12" width="52" height="40" rx="5" stroke="#E3000B" strokeWidth="2.5"/>
        <circle cx="16" cy="24" r="3.5" fill="#E3000B"/>
        <circle cx="28" cy="24" r="3.5" fill="#E3000B"/>
        <circle cx="40" cy="24" r="3.5" fill="#E3000B"/>
        <circle cx="52" cy="24" r="3.5" fill="#E3000B"/>
        <circle cx="16" cy="38" r="3.5" fill="#E3000B"/>
        <circle cx="28" cy="38" r="3.5" fill="#E3000B"/>
        <circle cx="40" cy="38" r="3.5" fill="#E3000B"/>
        <circle cx="52" cy="38" r="3.5" fill="#E3000B"/>
      </svg>
    ),
  },
  {
    name: 'Brick Owl',
    desc: 'Another trusted LEGO marketplace with a great community. Find our full catalog here too.',
    url: 'https://www.brickowl.com',
    username: '@ReplayBricks',
    color: '#FFD700',
    gradient: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20 hover:border-yellow-500/40',
    icon: (
      <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
        <circle cx="22" cy="22" r="16" stroke="#FFD700" strokeWidth="2.5"/>
        <circle cx="42" cy="22" r="16" stroke="#FFD700" strokeWidth="2.5"/>
        <circle cx="22" cy="22" r="4" fill="#FFD700" opacity="0.3"/>
        <circle cx="42" cy="22" r="4" fill="#FFD700" opacity="0.3"/>
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

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {MARKETPLACES.map((mp, i) => (
          <ScrollReveal key={mp.name} delay={0.15 * i}>
            <a
              href={mp.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block group relative ${mp.bg} border ${mp.border} rounded-2xl p-6 md:p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            >
              {/* Background gradient glow */}
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
