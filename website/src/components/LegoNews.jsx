import { ScrollReveal, Section, SectionHeading } from './SectionWrapper';

export const NEWS_ARTICLES = [
  {
    title: "LEGO Star Wars 75313 AT-AT Shows Strong Post-Retirement Growth",
    source: "BrickEconomy",
    date: "2026-05-03",
    snippet:
      "The UCS AT-AT has seen a 34% increase since retirement in December 2025, outperforming most other large sets.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    title: "Top 10 Sets Retiring in Q2 2026 — What Investors Need to Know",
    source: "Investabrick",
    date: "2026-05-02",
    snippet:
      "From the Botanical Collection to Architecture landmarks, these retiring sets present the best buying opportunities this quarter.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-purple-500 to-violet-500",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
  },
  {
    title: "Market Analysis: Botanical Collection Continues to Dominate Returns",
    source: "BrickEconomy",
    date: "2026-05-01",
    snippet:
      "Sets like 10311 Orchid and 10309 Succulents have averaged 45% appreciation within 12 months of retirement.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    title: "LEGO Architecture 21056 Taj Mahal Retirement Confirmed for June",
    source: "Brickset",
    date: "2026-04-29",
    snippet:
      "The iconic architectural landmark set is entering its final production run. Current MSRP $119.99 — expected to double within 6 months.",
    url: "https://brickset.com/",
    badgeColor: "from-green-500 to-emerald-500",
    badgeBg: "bg-green-500/10",
    badgeText: "text-green-400",
    badgeBorder: "border-green-500/30",
  },
  {
    title: "Reddit Roundup: Community Picks for Best Investment Sets This Month",
    source: "r/legoinvesting",
    date: "2026-04-28",
    snippet:
      "Reddit investors are bullish on Speed Champions, Modular Buildings, and retiring Technic sets.",
    url: "https://www.reddit.com/r/legoinvesting/",
    badgeColor: "from-orange-500 to-amber-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-400",
    badgeBorder: "border-orange-500/30",
  },
  {
    title: "BrickLink Price Guide: Marvel Minifigures Outperform Full Sets",
    source: "BrickLink",
    date: "2026-04-27",
    snippet:
      "Data shows individual Marvel minifigures from retired sets appreciating 200-400% while complete set values grow more modestly.",
    url: "https://www.bricklink.com/",
    badgeColor: "from-red-500 to-rose-500",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-400",
    badgeBorder: "border-red-500/30",
  },
  {
    title: "Lotus Flowers 10349 Latest Botanical Set — Pre-Order Analysis",
    source: "BrickEconomy",
    date: "2026-04-26",
    snippet:
      "The newest Botanical set is already showing strong pre-order demand. Historical data suggests this theme rarely disappoints.",
    url: "https://www.brickeconomy.com/",
    badgeColor: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
  },
  {
    title: "Investing in LEGO vs. Traditional Assets: 2026 Mid-Year Report",
    source: "Brickfact",
    date: "2026-04-25",
    snippet:
      "LEGO sets averaged 11% annual returns over the past 5 years, outperforming gold (8%) and matching the S&P 500.",
    url: "https://www.brickfact.com/",
    badgeColor: "from-teal-500 to-cyan-500",
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-400",
    badgeBorder: "border-teal-500/30",
  },
];

export default function LegoNews() {
  return (
    <Section id="news" className="section-secondary">
      <SectionHeading
        label="Market Intelligence"
        title="LEGO Investment Insider 📊"
        subtitle="Weekly market intelligence for LEGO investors. Replay Bricks is your insider source for LEGO investment news, market analysis, and the stories that matter to serious collectors and investors."
      />

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {NEWS_ARTICLES.map((article, i) => (
          <ScrollReveal key={i} delay={0.08 * i}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group relative bg-[#0f0f1a]/80 border border-white/5 rounded-2xl p-5 md:p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-white/10 h-full"
            >
              {/* Hover gradient glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E3000B]/0 via-transparent to-[#E3000B]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Source badge + date row */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${article.badgeBg} ${article.badgeBorder} border ${article.badgeText}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${article.badgeColor}`}
                    />
                    {article.source}
                  </span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {article.date}
                  </span>
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
          News aggregated from public sources. Articles link to original publishers.
          Not financial advice — bricks only go up. 🧱📈
        </p>
      </ScrollReveal>
    </Section>
  );
}
