import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

export default function About() {
  return (
    <Section id="about" className="section-dark-2">
      <SectionHeading
        label="Our Story"
        title="Building Dreams Since 1999"
        subtitle="For over two decades, we've been helping LEGO enthusiasts find the pieces they need to bring their visions to life."
      />

      <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        {/* Left — Story */}
        <div className="space-y-6">
          <ScrollReveal>
            <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E3000B] to-[#b80009] flex items-center justify-center text-white font-bold text-lg">
                  B+A
                </div>
                <div>
                  <p className="text-white font-semibold">Brian & Amanda</p>
                  <p className="text-gray-500 text-sm">Founders, Replay Bricks</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                We've been part of the LEGO community since 1999 — building, collecting, 
                and eventually curating for others. What started as a shared passion for 
                those satisfying clicks has grown into a trusted source for LEGO enthusiasts worldwide.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-gray-400 leading-relaxed pl-4 border-l-2 border-[#E3000B]/50">
              <span className="font-playfair text-[#FFD700] italic">"Same Bricks, New Stories."</span>{' '}
              That's our philosophy. Every brick has a past, but we believe the best 
              creations are yet to be built. We're here to help you write your next chapter.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap gap-4">
              {['Trusted Seller', '20+ Years', 'Premium Quality', 'Ships all across the USA'].map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Right — Stats/Values */}
        <div className="space-y-4">
          {[
            { number: '1,000+', label: 'Happy Customers', color: 'from-[#E3000B] to-[#b80009]' },
            { number: '120K+', label: 'Pieces for Sale', color: 'from-[#FFD700] to-[#ff8c00]' },
            { number: '100+', label: 'Sets in Inventory', color: 'from-[#E3000B] to-[#FFD700]' },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={0.1 * i}>
              <div className="bg-[#0f0f1a]/40 border border-white/5 rounded-xl p-5 flex items-center gap-5 hover:border-red-900/30 transition-colors">
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent min-w-[80px]`}>
                  {stat.number}
                </div>
                <div>
                  <p className="text-white font-semibold">{stat.label}</p>
                  <p className="text-gray-500 text-sm">and counting</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
