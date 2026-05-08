import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  useState(() => {
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate captcha
    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);

    try {
      // Send to backend for notification
      await fetch('http://127.0.0.1:3001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } catch (err) {
      console.warn('Contact notification backend not available');
    }
    
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setCaptchaAnswer('');
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <Section id="contact" className="section-dark-2">
      <SectionHeading
        label="Get in Touch"
        title="Let's Talk Bricks"
        subtitle="Have a question about a set? Looking for something specific? We'd love to hear from you."
      />

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <ScrollReveal>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
                className="w-full px-5 py-3.5 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
                className="w-full px-5 py-3.5 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300"
              />
            </div>
            <div>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your Message"
                required
                rows={4}
                className="w-full px-5 py-3.5 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300 resize-none"
              />
            </div>
            {/* Math captcha - anti-spam */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prove you're human <span className="text-[#E3000B]">*</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-sm bg-[#0f0f1a] px-3 py-1.5 rounded-lg border border-white/10">
                  {captchaA} + {captchaB} = ?
                </span>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  required
                  className="w-24 px-3 py-2 bg-[#0f0f1a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] text-center"
                />
                {captchaError && (
                  <span className="text-red-400 text-xs">Wrong answer, try again</span>
                )}
              </div>
            </div>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full px-6 py-3.5 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 cursor-pointer"
            >
              {submitted ? '✓ Message Sent!' : 'Send Message'}
            </motion.button>
            {submitted && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-sm text-center"
              >
                Thanks for reaching out! We'll get back to you soon. 🧱
              </motion.p>
            )}
          </form>
        </ScrollReveal>

        {/* Contact Info */}
        <ScrollReveal delay={0.2}>
          <div className="space-y-6">
            <div className="bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">Contact Info</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#E3000B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <a href="mailto:Amanda@replaybrick.com" className="text-white hover:text-[#E3000B] transition-colors">
                      Amanda@replaybrick.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Response Time</p>
                    <p className="text-white">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f1a]/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-3">Quick Response</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We typically respond within 24 hours. For the fastest service, 
                reach out to us on Instagram or through our marketplace stores.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
