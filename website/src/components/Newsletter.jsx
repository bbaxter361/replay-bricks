import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState({
    weekly: true,
    alerts: false,
  });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    // Simulate submission — wire up to real backend later
    setTimeout(() => {
      // Store subscriber in localStorage
      const existing = JSON.parse(localStorage.getItem('replay_subscribers') || '[]');
      const subscriber = {
        email,
        name: name.trim() || null,
        interests: Object.entries(interests)
          .filter(([, v]) => v)
          .map(([k]) => k),
        subscribedAt: new Date().toISOString(),
      };
      existing.push(subscriber);
      localStorage.setItem('replay_subscribers', JSON.stringify(existing));

      setStatus('success');
      setEmail('');
      setName('');
    }, 1000);
  };

  const toggleInterest = (key) => {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Section id="newsletter" className="section-dark-2">
      <div className="max-w-2xl mx-auto">
        <SectionHeading
          label="Stay Connected"
          title="The Brick Bulletin 📰"
          subtitle="Weekly LEGO investment insights, market analysis, and our unfiltered takes on what's worth buying"
        />

        <ScrollReveal delay={0.3}>
          {status === 'success' ? (
            /* ── Success State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative max-w-lg mx-auto bg-[#1a1a2e]/80 backdrop-blur-sm border border-green-500/20 rounded-2xl p-8 text-center"
            >
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none" />
              {/* Icon */}
              <div className="relative z-10 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="relative z-10 text-xl font-bold text-white mb-2">
                Welcome to the Brick Club! 🧱
              </h3>
              <p className="relative z-10 text-gray-400 mb-6">
                Check your inbox every Friday.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="relative z-10 px-6 py-2.5 border border-white/10 text-gray-300 hover:text-white hover:border-white/30 rounded-xl transition-all duration-300 cursor-pointer text-sm"
              >
                Subscribe Another Email
              </button>
            </motion.div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
                {/* Name field (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name <span className="text-gray-600 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      disabled={status === 'loading'}
                      className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300 disabled:opacity-50"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-yellow-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                {/* Email field (required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-[#E3000B]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={status === 'loading'}
                      className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300 disabled:opacity-50"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-yellow-500/0 opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>

                {/* Interest checkboxes */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    What would you like to receive?
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={interests.weekly}
                        onChange={() => toggleInterest('weekly')}
                        disabled={status === 'loading'}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                          interests.weekly
                            ? 'bg-[#E3000B] border-[#E3000B]'
                            : 'border-white/20 bg-[#0f0f1a] group-hover:border-white/30'
                        }`}
                      >
                        {interests.weekly && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-200 font-medium">I want the weekly newsletter</span>
                      <p className="text-xs text-gray-500 mt-0.5">Every Friday: market insights, set reviews, and Brian's takes</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={interests.alerts}
                        onChange={() => toggleInterest('alerts')}
                        disabled={status === 'loading'}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                          interests.alerts
                            ? 'bg-[#E3000B] border-[#E3000B]'
                            : 'border-white/20 bg-[#0f0f1a] group-hover:border-white/30'
                        }`}
                      >
                        {interests.alerts && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-200 font-medium">I want investment alerts</span>
                      <p className="text-xs text-gray-500 mt-0.5">Urgent notifications: retiring sets, price spikes, hot deals</p>
                    </div>
                  </label>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  whileTap={{ scale: 0.97 }}
                  className="w-full px-6 py-3.5 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Subscribe Now
                    </>
                  )}
                </motion.button>
              </div>

              {/* Bottom disclaimer */}
              <p className="mt-4 text-gray-500 text-xs text-center">
                No spam ever. Just brick goodness. Unsubscribe anytime.
              </p>
            </form>
          )}
        </ScrollReveal>
      </div>
    </Section>
  );
}
