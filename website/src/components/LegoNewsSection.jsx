import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

const FALLBACK_ARTICLES = [
  {
    title: "Replay Bricks Launches Original LEGO News Coverage",
    date: "2026-06-26",
    snippet: "We're proud to announce our new original LEGO news section — bringing you the latest set announcements, rumors, and community updates directly from our team.",
    fullContent: "Replay Bricks is thrilled to launch our very own LEGO news desk. Our team monitors Discord, official LEGO channels, and community sources to bring you timely, original reporting on new set releases, retirement dates, and the stories that matter to LEGO fans and investors alike. Stay tuned for daily updates!",
  },
];

export default function LegoNewsSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    fetch('/lego-news.json?' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
        } else {
          setArticles(FALLBACK_ARTICLES);
        }
      })
      .catch(() => {
        setArticles(FALLBACK_ARTICLES);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Section id="news" className="section-dark-2">
      <SectionHeading
        label="Latest LEGO News"
        title="LEGO News"
        subtitle="Original reporting on new LEGO set releases, announcements, and community highlights — straight from our team."
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#E3000B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🧱</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Articles Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Our LEGO news team is hard at work. Check back soon for the latest set releases, rumors, and community updates.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {articles.slice(0, 6).map((article, i) => (
            <ScrollReveal key={i} delay={0.08 * i}>
              <div
                onClick={() => article.fullContent && toggleExpand(i)}
                className={`block group relative bg-[#0f0f1a]/80 border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-white/10 h-full ${
                  article.fullContent ? 'cursor-pointer' : ''
                }`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E3000B]/0 via-transparent to-[#E3000B]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Source badge + date row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E3000B]/10 border border-[#E3000B]/30 text-[#E3000B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#E3000B] to-red-400" />
                      Replay Bricks
                    </span>
                    {article.date && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-semibold text-white mb-2 leading-snug group-hover:text-[#E3000B] transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Snippet */}
                  <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">
                    {article.snippet}
                  </p>

                  {/* Expand indicator or read more */}
                  {article.fullContent ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E3000B] group-hover:gap-2 transition-all duration-300 mt-auto">
                      {expandedIndex === i ? 'Show Less' : 'Read Full Article'}
                      <motion.svg
                        animate={{ rotate: expandedIndex === i ? 180 : 0 }}
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 mt-auto">
                      No full article available
                    </span>
                  )}
                </div>

                {/* Expanded full content */}
                <AnimatePresence>
                  {expandedIndex === i && article.fullContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {article.fullContent}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <ScrollReveal delay={0.7}>
        <div className="text-center mt-10">
          <a
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#E3000B] hover:bg-[#b80009] text-white rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
          >
            View All News
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </ScrollReveal>
    </Section>
  );
}
