import { ScrollReveal } from './SectionWrapper';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#0f0f1a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 48 40" className="w-9 h-8 flex-shrink-0">
                <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
                <circle cx="10" cy="20" r="2" fill="#FFD700"/>
                <circle cx="20" cy="20" r="2" fill="#FFD700"/>
                <circle cx="30" cy="20" r="2" fill="#FFD700"/>
                <circle cx="40" cy="20" r="2" fill="#FFD700"/>
                <circle cx="10" cy="30" r="2" fill="#FFD700"/>
                <circle cx="20" cy="30" r="2" fill="#FFD700"/>
                <circle cx="30" cy="30" r="2" fill="#FFD700"/>
                <circle cx="40" cy="30" r="2" fill="#FFD700"/>
              </svg>
              <span className="font-anton text-xl text-white tracking-wider">
                REPLAY<span className="text-[#E3000B]">.</span>BRICKS
              </span>
            </div>
            <p className="font-playfair text-[#FFD700] italic text-sm mb-3">
              "Same Bricks, New Stories."
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Premium LEGO resale since 1999. Curating the finest bricks for builders across the USA.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Products', href: '#products' },
                { label: 'Shop', href: '#marketplaces' },
                { label: 'Newsletter', href: '#newsletter' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(link.href.slice(1));
                      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplaces */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop With Us</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'BrickLink', url: 'https://www.bricklink.com' },
                { label: 'Brick Owl', url: 'https://www.brickowl.com' },
              ].map((mp) => (
                <li key={mp.label}>
                  <a
                    href={mp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
                  >
                    {mp.label}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            {/* Social */}
            <div className="mt-6">
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <a
                href="https://www.instagram.com/replaybricks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors text-sm"
              >
                <svg viewBox="0 0 64 64" className="w-5 h-5" fill="none">
                  <rect x="6" y="6" width="52" height="52" rx="13" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.3"/>
                  <circle cx="48" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                </svg>
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Replay Bricks. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#hero" onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} className="text-gray-500 hover:text-white transition-colors text-xs cursor-pointer">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
