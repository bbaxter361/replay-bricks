import { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

// ── Re-usable scroll-reveal wrapper ──
export function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const controls = useAnimation();

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 60 : direction === 'down' ? -60 : 0,
      x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  useEffect(() => {
    if (isInView) controls.start('visible');
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Section wrapper ──
export function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}

// ── Section heading ──
export function SectionHeading({ label, title, subtitle, light = true }) {
  return (
    <div className="text-center mb-16">
      <ScrollReveal>
        <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-400 border border-red-500/30 rounded-full bg-red-500/10 mb-4">
          {label}
        </span>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${light ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      </ScrollReveal>
      {subtitle && (
        <ScrollReveal delay={0.2}>
          <p className={`max-w-2xl mx-auto text-lg leading-relaxed ${light ? 'text-gray-400' : 'text-gray-600'}`}>
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
