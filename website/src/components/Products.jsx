import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

const PRODUCT_CATEGORIES = [
  {
    title: 'LEGO Sets',
    desc: 'Complete sets from every era — retired classics, recent releases, and everything in between.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="#E3000B" strokeWidth="2.5" fill="#E3000B" fillOpacity="0.1"/>
        <circle cx="20" cy="28" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="32" cy="28" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="44" cy="28" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="20" cy="40" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="32" cy="40" r="3" fill="#FFD700" opacity="0.6"/>
        <circle cx="44" cy="40" r="3" fill="#FFD700" opacity="0.6"/>
      </svg>
    ),
  },
  {
    title: 'Minifigures',
    desc: 'Rare and collectible minifigures from every theme. Complete collections and hard-to-find singles.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <circle cx="32" cy="16" r="8" stroke="#FFD700" strokeWidth="2.5" fill="#FFD700" fillOpacity="0.1"/>
        <rect x="16" y="24" width="8" height="24" rx="3" stroke="#E3000B" strokeWidth="2.5" fill="#E3000B" fillOpacity="0.1"/>
        <rect x="40" y="24" width="8" height="24" rx="3" stroke="#E3000B" strokeWidth="2.5" fill="#E3000B" fillOpacity="0.1"/>
        <rect x="20" y="28" width="24" height="28" rx="4" stroke="#E3000B" strokeWidth="2.5" fill="#E3000B" fillOpacity="0.1"/>
      </svg>
    ),
  },
  {
    title: 'Parts & Pieces',
    desc: 'Massive inventory of individual bricks, plates, tiles, and specialty elements for your MOCs.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <rect x="6" y="20" width="52" height="24" rx="3" stroke="#E3000B" strokeWidth="2.5" fill="#E3000B" fillOpacity="0.1"/>
        <circle cx="16" cy="28" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="26" cy="28" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="36" cy="28" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="46" cy="28" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="16" cy="36" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="26" cy="36" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="36" cy="36" r="2.5" fill="#FFD700" opacity="0.6"/>
        <circle cx="46" cy="36" r="2.5" fill="#FFD700" opacity="0.6"/>
      </svg>
    ),
  },
  {
    title: 'Hard-to-Find',
    desc: 'Discontinued sets, rare elements, and exclusive promotional items you won\'t find anywhere else.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
        <polygon points="32,6 58,22 58,44 32,58 6,44 6,22" stroke="#FFD700" strokeWidth="2.5" fill="#FFD700" fillOpacity="0.1"/>
        <circle cx="32" cy="22" r="3" fill="#E3000B" opacity="0.8"/>
        <circle cx="24" cy="34" r="3" fill="#E3000B" opacity="0.8"/>
        <circle cx="40" cy="34" r="3" fill="#E3000B" opacity="0.8"/>
      </svg>
    ),
  },
];

export default function Products() {
  return (
    <Section id="products" className="section-secondary">
      <SectionHeading
        label="What We Sell"
        title="Everything LEGO"
        subtitle="From complete sets to individual bricks, we curate the finest LEGO inventory for builders of all kinds."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {PRODUCT_CATEGORIES.map((product, i) => (
          <ScrollReveal key={product.title} delay={0.1 * i}>
            <div className="group relative bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6 transition-all duration-500 hover:border-red-500/30 hover:bg-[#0f0f1a]/60 hover:shadow-xl hover:shadow-red-900/10 h-full">
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 via-transparent to-yellow-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="mb-4 group-hover:scale-110 transition-transform duration-500">
                  {product.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{product.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{product.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
