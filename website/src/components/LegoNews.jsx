import { useState, useEffect } from 'react';
import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

// Fallback articles if the JSON hasn't loaded yet
const FALLBACK_ARTICLES = [
  {
    title: "LEGO Star Wars 75313 AT-AT Shows Strong Post-Retirement Growth",
    source: "BrickEconomy",
    date: "",
    snippet: "The UCS AT-AT has seen a 34% increase since retirement in December 2025, outperforming most other large sets.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    title: "Top 10 Sets Retiring This Quarter — What Investors Need to Know",
    source: "Investabrick",
    date: "",
    snippet: "From the Botanical Collection to Architecture landmarks, these retiring sets present the best buying opportunities.",
    url: "https://investabrick.com/",
    badgeColor: "from-purple-500 to-violet-500",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
  },
  {
    title: "Market Analysis: Botanical Collection Continues to Dominate Returns",
    source: "BrickEconomy",
    date: "",
    snippet: "Sets like 10311 Orchid and 10309 Succulents have averaged 45% appreciation within 12 months of retirement.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    title: "LEGO Architecture 21056 Taj Mahal Retirement Confirmed",
    source: "Brickset",
    date: "",
    snippet: "The iconic architectural landmark set is entering its final production run. Current MSRP $119.99.",
    url: "https://brickset.com/",
    badgeColor: "from-green-500 to-emerald-500",
    badgeBg: "bg-green-500/10",
    badgeText: "text-green-400",
    badgeBorder: "border-green-500/30",
  },
  {
    title: "BrickLink Price Guide: Marvel Minifigures Outperform Full Sets",
    source: "BrickLink",
    date: "",
    snippet: "Data shows individual Marvel minifigures from retired sets appreciating 200-400% while complete set values grow more modestly.",
    url: "https://www.bricklink.com/",
    badgeColor: "from-red-500 to-rose-500",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-400",
    badgeBorder: "border-red-500/30",
  },
  {
    title: "Investing in LEGO vs. Traditional Assets: 2026 Mid-Year Report",
    source: "Brickfact",
    date: "",
    snippet: "LEGO sets averaged 11% annual returns over the past 5 years, outperforming gold and matching the S&P 500.",
    url: "https://www.brickfact.com/",
    badgeColor: "from-teal-500 to-cyan-500",
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-400",
    badgeBorder: "border-teal-500/30",
  },
  {
    title: "Reddit Roundup: Community Picks for Best Investment Sets This Month",
    source: "r/legoinvesting",
    date: "",
    snippet: "Reddit investors are bullish on Speed Champions, Modular Buildings, and retiring Technic sets.",
    url: "https://www.reddit.com/r/legoinvesting/",
    badgeColor: "from-orange-500 to-amber-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-400",
    badgeBorder: "border-orange-500/30",
  },
  {
    title: "LEGO Icons 10349 Lotus Flowers — Latest Botanical Set Analysis",
    source: "BrickEconomy",
    date: "",
    snippet: "The newest Botanical set is already showing strong pre-order demand. Historical data suggests this theme rarely disappoints.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
];

// Re-export for NewsletterEditor (uses fallback data)
export const NEWS_ARTICLES = FALLBACK_ARTICLES;

export default function LegoNews() {
  const [articles, setArticles] = useState(FALLBACK_ARTICLES);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetch('/news-data.json?' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
          if (data.updated) {
            const d = new Date(data.updated);
            setLastUpdated(d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
          }
        }
      })
      .catch(() => {
        // JSON not available, fallback is fine
      });
  }, []);

  return (
    <Section id="investing" className="section-secondary">
      <SectionHeading
        label="Market Intelligence"
        title="LEGO Investment Insider"
        subtitle="Daily market intelligence for LEGO investors. Replay Bricks is your insider source for LEGO investment news, market analysis, and the stories that matter to serious collectors and investors."
      />

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {articles.map((article, i) => (
          <ScrollReveal key={i} delay={0.08 * i}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group relative bg-[#0f0f1a]/80 border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-white/10 h-full"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E3000B]/0 via-transparent to-[#E3000B]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Source badge + date row */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      article.badgeBg || 'bg-blue-500/10'
                    } ${article.badgeBorder || 'border-blue-500/30'} border ${
                      article.badgeText || 'text-blue-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${
                        article.badgeColor || 'from-blue-500 to-cyan-500'
                      }`}
                    />
                    {article.source}
                  </span>
                  {article.date && (
                    <span className="text-xs text-gray-600 ml-auto">
                      {article.date}
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

                {/* Read More link */}
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E3000B] group-hover:gap-2 transition-all duration-300 mt-auto">
                  Read More
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>

      {/* Bottom disclaimer */}
      <ScrollReveal delay={0.7}>
        <p className="text-center mt-10 text-xs text-gray-600">
          News aggregated daily from public sources. Articles link to original publishers.
          Not financial advice — bricks only go up. 🧱📈
        </p>
      </ScrollReveal>
    </Section>
  );
}
