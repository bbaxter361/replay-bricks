import { ScrollReveal, Section } from './SectionWrapper';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    handle: '@replaybricks',
    url: 'https://www.instagram.com/replaybricks',
    desc: 'Follow our latest finds, builds, and behind-the-scenes content.',
    color: 'hover:bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    border: 'border-pink-500/20 hover:border-pink-500/40',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none">
        <rect x="6" y="6" width="52" height="52" rx="13" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2.5"/>
        <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.3"/>
        <circle cx="48" cy="16" r="3" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
];

export default function Social() {
  return (
    <Section id="social" className="section-dark">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-pink-400 border border-pink-500/30 rounded-full bg-pink-500/10 mb-6">
            Connect With Us
          </span>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Follow the Journey
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex flex-col items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group inline-flex items-center gap-4 px-8 py-4 bg-white/5 border ${social.border} rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-900/10`}
              >
                <span className="text-gray-400 group-hover:text-white transition-colors duration-300">
                  {social.icon}
                </span>
                <div className="text-left">
                  <p className="text-white font-semibold text-lg">{social.name}</p>
                  <p className="text-gray-400 text-sm">{social.handle}</p>
                </div>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="mt-8 text-gray-500 text-sm max-w-md mx-auto">
            Tag us in your builds! We love seeing what our bricks become. 
            Share your creations with <span className="text-[#E3000B]">#ReplayBricks</span>
          </p>
        </ScrollReveal>
      </div>
    </Section>
  );
}
