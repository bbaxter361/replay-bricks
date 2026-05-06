import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './SectionWrapper';

const FLOATING_BRICKS = [
  { color: '#E3000B', size: 24, x: 15, y: 20, delay: 0 },
  { color: '#FFD700', size: 18, x: 75, y: 15, delay: 0.5 },
  { color: '#E3000B', size: 20, x: 85, y: 60, delay: 1 },
  { color: '#FFD700', size: 16, x: 10, y: 70, delay: 1.5 },
  { color: '#E3000B', size: 14, x: 90, y: 35, delay: 0.8 },
  { color: '#ffffff', size: 12, x: 50, y: 10, delay: 2 },
];

function BrickStud({ cx, cy }) {
  return <circle cx={cx} cy={cy} r="3" fill="currentColor" opacity="0.3" />;
}

function LegoBrickSvg({ color, size }) {
  const bw = size * 1.8;
  const bh = size * 0.55;
  return (
    <svg width={bw} height={bh + size * 0.2} viewBox={`0 0 ${bw} ${bh + size * 0.2}`} fill={color} opacity="0.6">
      {/* Brick body */}
      <rect x="1" y={size * 0.15} width={bw - 2} height={bh} rx="3" />
      {/* Studs on top */}
      {[...Array(size > 20 ? 3 : 2)].map((_, i) => (
        <circle key={i} cx={(bw / (size > 20 ? 4 : 3)) * (i + 1)} cy={size * 0.12} r={bw * 0.055} />
      ))}
      {/* Highlight edge */}
      <rect x="3" y={size * 0.17} width={bw - 6} height="2" rx="1" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

function FloatingBrick({ color, size, x, y, delay }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, y: 50, rotate: -20 }}
      animate={{ opacity: 0.15, y: 0, rotate: 0 }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width={size * 1.8} height={size * 0.75} viewBox={`0 0 ${size * 1.8} ${size * 0.75}`}>
          <rect x="1" y={size * 0.15} width={size * 1.8 - 2} height={size * 0.55} rx="3" fill={color} opacity="0.6"/>
          {[...Array(size > 20 ? 3 : 2)].map((_, i) => (
            <circle key={i} cx={(size * 1.8 / (size > 20 ? 4 : 3)) * (i + 1)} cy={size * 0.12} r={size * 1.8 * 0.055} fill={color} opacity="0.6"/>
          ))}
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Floating bricks in background */}
      {FLOATING_BRICKS.map((brick, i) => (
        <FloatingBrick key={i} {...brick} />
      ))}

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <ScrollReveal delay={0.2}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8"
          >
            <svg viewBox="0 0 80 64" className="w-20 h-16 mx-auto mb-6">
              <rect x="2" y="20" width="76" height="40" rx="5" fill="#E3000B"/>
              <circle cx="12" cy="32" r="4" fill="#FFD700"/>
              <circle cx="28" cy="32" r="4" fill="#FFD700"/>
              <circle cx="44" cy="32" r="4" fill="#FFD700"/>
              <circle cx="60" cy="32" r="4" fill="#FFD700"/>
              <circle cx="12" cy="48" r="4" fill="#FFD700"/>
              <circle cx="28" cy="48" r="4" fill="#FFD700"/>
              <circle cx="44" cy="48" r="4" fill="#FFD700"/>
              <circle cx="60" cy="48" r="4" fill="#FFD700"/>
            </svg>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <h1 className="font-anton text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.9] tracking-tight mb-6">
            REPLAY
            <br />
            <span className="text-[#E3000B]">BRICKS</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p className="font-playfair text-xl sm:text-2xl md:text-3xl text-[#FFD700] italic mb-8">
            "Same Bricks, New Stories."
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.8}>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed mb-10">
            Premium LEGO resale since 1999. Curated sets, rare minifigures, 
            and hard-to-find parts — given new life by passionate builders.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={1.0}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#marketplaces"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('marketplaces');
                if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-full transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('about');
                if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/5"
            >
              Our Story
            </a>
          </div>
        </ScrollReveal>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
}
