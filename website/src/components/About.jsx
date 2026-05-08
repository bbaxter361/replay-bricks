import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

export default function About() {
  return (
    <Section id="about" className="section-dark-2">
      <SectionHeading
        label="Our Story"
        title="Building Dreams Since 1999"
        subtitle="For over two decades, we've been helping LEGO enthusiasts find the pieces they need to bring their visions to life."
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Founders card */}
        <ScrollReveal>
          <div className="bg-[#0f0f1a]/60 border border-white/5 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#E3000B] to-[#b80009] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                B+A
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Brian & Amanda</p>
                <p className="text-gray-500 text-sm">Founders, Replay Bricks</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              We've been part of the LEGO community since 1999 — building, collecting, 
              and eventually curating for others. What started as a shared passion for 
              those satisfying clicks has grown into a trusted source for LEGO enthusiasts worldwide.
            </p>
          </div>
        </ScrollReveal>

        {/* Quote */}
        <ScrollReveal delay={0.15}>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-gray-400 leading-relaxed text-lg">
              <span className="font-playfair text-[#FFD700] italic text-xl">"Same Bricks, New Stories."</span>
            </p>
            <p className="text-gray-500 mt-3 leading-relaxed">
              That's our philosophy. Every brick has a past, but we believe the best 
              creations are yet to be built. We're here to help you write your next chapter.
            </p>
          </div>
        </ScrollReveal>

        {/* Tags */}
        <ScrollReveal delay={0.25}>
          <div className="flex flex-wrap justify-center gap-3">
            {['Trusted Seller', '20+ Years', 'Premium Quality', 'Ships All Across the USA', '1000+ Happy Customers', '120K+ Pieces'].map((item) => (
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
    </Section>
  );
}
