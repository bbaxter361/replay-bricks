import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal } from '../components/SectionWrapper';
import BrickBackground from '../components/BrickBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FALLBACK_ARTICLES = [
  {
    title: "Replay Bricks Launches Original LEGO News Coverage",
    date: "2026-06-26",
    snippet: "We're proud to announce our new original LEGO news section — bringing you the latest set announcements, rumors, and community updates directly from our team.",
    fullContent: "Replay Bricks is thrilled to launch our very own LEGO news desk. Our team monitors Discord, official LEGO channels, and community sources to bring you timely, original reporting on new set releases, retirement dates, and the stories that matter to LEGO fans and investors alike. Stay tuned for daily updates!",
  },
];

export default function LegoNewsPage() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('');

  useEffect(() => {
    fetch('/lego-news.json?' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
          setFilteredArticles(data.articles);
        } else {
          setArticles(FALLBACK_ARTICLES);
          setFilteredArticles(FALLBACK_ARTICLES);
        }
      })
      .catch(() => {
        setArticles(FALLBACK_ARTICLES);
        setFilteredArticles(FALLBACK_ARTICLES);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(
        articles.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.snippet.toLowerCase().includes(query) ||
            (a.fullContent && a.fullContent.toLowerCase().includes(query))
        )
      );
    }
    setExpandedIndex(null);
  }, [searchQuery, articles]);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="relative min-h-screen">
      <BrickBackground />
      <Navbar currentSection={currentSection} showLogin />

      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E3000B] border border-[#E3000B]/30 rounded-full bg-[#E3000B]/10 mb-4">
                Original Reporting
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                LEGO News
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
                Original reporting on new LEGO set releases, announcements, rumors, and community highlights — curated by the Replay Bricks team.
              </p>
            </div>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={0.1}>
            <div className="max-w-md mx-auto mb-12">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#0f0f1a]/80 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B]/50 focus:ring-1 focus:ring-[#E3000B]/30 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-[#E3000B] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Articles Found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery
                  ? `No articles match "${searchQuery}". Try a different search term.`
                  : 'Our LEGO news team is hard at work. Check back soon!'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-5 py-2 text-sm font-semibold bg-[#E3000B] hover:bg-[#b80009] text-white rounded-lg transition-all duration-300 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          {!loading && filteredArticles.length > 0 && (
            <div className="mb-6 text-sm text-gray-500">
              Showing {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          )}

          {/* Articles grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredArticles.map((article, i) => (
              <ScrollReveal key={i} delay={0.05 * (i % 6)}>
                <div
                  onClick={() => article.fullContent && toggleExpand(i)}
                  className={`block group relative bg-[#0f0f1a]/80 border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-white/10 h-full ${
                    article.fullContent ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E3000B]/0 via-transparent to-[#E3000B]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Badge + date */}
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

                    {/* Action */}
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
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="relative z-10 mt-4 pt-4 border-t border-white/10">
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                            {article.fullContent}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
