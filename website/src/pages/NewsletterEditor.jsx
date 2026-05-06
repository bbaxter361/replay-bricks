import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NEWS_ARTICLES } from '../components/LegoNews';

const TOP_NEWS_COUNT = 5;

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getMonthYear() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function NewsletterEditor({ user, onLogout }) {
  const navigate = useNavigate();
  const [opinion, setOpinion] = useState('');
  const [hotSets, setHotSets] = useState('');
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  const topArticles = NEWS_ARTICLES.slice(0, TOP_NEWS_COUNT);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const generateNewsletter = useCallback(() => {
    const today = new Date();
    const dateStr = formatDate(today);
    const monthYear = getMonthYear();

    const newsletterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Brick Bulletin — ${monthYear}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f0f1a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #e0e0e0; }
    .container { max-width: 640px; margin: 0 auto; background: #1a1a2e; }
    .header { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); padding: 40px 30px; text-align: center; border-bottom: 3px solid #E3000B; }
    .header .logo { font-family: 'Anton', sans-serif; font-size: 28px; letter-spacing: 2px; color: #fff; margin-bottom: 8px; }
    .header .logo span { color: #E3000B; }
    .header .date { color: #888; font-size: 14px; }
    .section { padding: 30px; }
    .section-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .story { background: rgba(15,15,26,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin-bottom: 14px; }
    .story .source { display: inline-block; font-size: 11px; font-weight: 600; color: #E3000B; background: rgba(227,0,11,0.1); padding: 3px 10px; border-radius: 20px; margin-bottom: 8px; }
    .story h3 { font-size: 16px; color: #fff; margin: 0 0 6px 0; line-height: 1.4; }
    .story p { font-size: 13px; color: #999; margin: 0; line-height: 1.6; }
    .opinion { background: rgba(227,0,11,0.05); border: 1px solid rgba(227,0,11,0.15); border-radius: 12px; padding: 24px; margin: 10px 0 0 0; }
    .opinion h3 { font-size: 18px; color: #E3000B; margin: 0 0 12px 0; }
    .opinion p { font-size: 14px; color: #d0d0d0; line-height: 1.8; margin: 0; white-space: pre-wrap; }
    .hot-sets { margin-top: 20px; }
    .hot-sets h3 { font-size: 18px; color: #FFD700; margin: 0 0 12px 0; }
    .hot-sets p { font-size: 14px; color: #d0d0d0; line-height: 1.8; margin: 0; white-space: pre-wrap; }
    .footer { text-align: center; padding: 30px; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer p { font-size: 12px; color: #666; margin: 4px 0; }
    .footer a { color: #E3000B; text-decoration: none; }
    .cta { text-align: center; padding: 10px 30px 30px; }
    .cta a { display: inline-block; background: #E3000B; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 10px; font-weight: 600; font-size: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">REPLAY<span>.</span>BRICKS</div>
      <h2 style="color:#fff;margin:10px 0 4px;font-size:24px;">The Brick Bulletin 📰</h2>
      <div class="date">${dateStr}</div>
    </div>

    <div class="section">
      <h2 class="section-title">📈 This Week in LEGO Investing</h2>
      ${topArticles
        .slice(0, 3)
        .map(
          (a) => `
      <div class="story">
        <span class="source">${a.source}</span>
        <h3>${a.title}</h3>
        <p>${a.snippet} <a href="${a.url}" style="color:#E3000B;">Read more →</a></p>
      </div>`
        )
        .join('')}
    </div>

    <div class="section" style="padding-top:0;">
      <h2 class="section-title">🧱 Brian's Corner</h2>
      <div class="opinion">
        <h3>Thoughts from Brian</h3>
        <p>${opinion || '<em style="color:#666;">(No opinion column written yet — check back next week!)</em>'}</p>
      </div>
    </div>

    <div class="section" style="padding-top:0;">
      <h2 class="section-title">🔥 Hot Sets to Watch</h2>
      <div class="hot-sets">
        <p>${hotSets || '<em style="color:#666;">(No hot sets listed this week.)</em>'}</p>
      </div>
      ${topArticles.slice(3, 5)
        .map(
          (a) => `
      <div class="story">
        <span class="source">${a.source}</span>
        <h3>${a.title}</h3>
        <p>${a.snippet}</p>
      </div>`
        )
        .join('')}
    </div>

    <div class="cta">
      <a href="https://replaybrick.com/#newsletter">📬 Subscribe to The Brick Bulletin</a>
    </div>

    <div class="footer">
      <p><strong>Replay Bricks</strong> — Same Bricks, New Stories since 1999</p>
      <p>Shop: <a href="https://store.bricklink.com/replaybrick">BrickLink</a> · <a href="https://www.brickowl.com/store/replay-bricks">Brick Owl</a></p>
      <p style="margin-top:12px;color:#555;">You're receiving this email because you subscribed at replaybrick.com.<br/><a href="https://replaybrick.com/unsubscribe">Unsubscribe</a> anytime.</p>
    </div>
  </div>
</body>
</html>`;

    setPreview(newsletterHtml);
    setCopied(false);

    // Scroll to preview
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [opinion, hotSets, topArticles]);

  const copyHtml = async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = preview;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Portal</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 48 40" className="w-7 h-6">
              <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
              <circle cx="10" cy="20" r="2" fill="#FFD700"/>
              <circle cx="20" cy="20" r="2" fill="#FFD700"/>
              <circle cx="30" cy="20" r="2" fill="#FFD700"/>
              <circle cx="40" cy="20" r="2" fill="#FFD700"/>
            </svg>
            <span className="font-anton text-lg text-white tracking-wider">
              REPLAY<span className="text-[#E3000B]">.</span>BRICKS
            </span>
            <span className="text-xs bg-[#E3000B]/20 text-[#E3000B] px-2 py-0.5 rounded-full font-medium">Newsletter Editor</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/30 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Editor Body ── */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              The Brick Bulletin 📰
            </h1>
            <p className="text-gray-400">
              Compose your weekly newsletter — {formatDate(new Date())}
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* ── Left Panel: News Headlines ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#E3000B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h2 className="text-lg font-bold text-white">Current News Headlines</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Top {TOP_NEWS_COUNT} articles from the seeded news feed — the top 3 will appear in the newsletter.
              </p>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {topArticles.map((article, i) => (
                  <div
                    key={i}
                    className="bg-[#0f0f1a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-[#E3000B] bg-[#E3000B]/10 px-2 py-0.5 rounded-full">
                        {article.source}
                      </span>
                      <span className="text-xs text-gray-600">{article.date}</span>
                      {i < 3 && (
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full ml-auto">
                          TOP STORY
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {article.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right Panel: Editor ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-5"
            >
              {/* Opinion Column */}
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#E3000B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h2 className="text-lg font-bold text-white">Brian's Corner</h2>
                </div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your weekly opinion column
                </label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder={`Write your unfiltered take on this week's LEGO market...

What's worth buying? What's overhyped? What are you excited about?

— Brian`}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all resize-y min-h-[160px]"
                />
              </div>

              {/* Hot Sets */}
              <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <h2 className="text-lg font-bold text-white">🔥 Hot Sets to Watch</h2>
                </div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sets you're tracking this week
                </label>
                <textarea
                  value={hotSets}
                  onChange={(e) => setHotSets(e.target.value)}
                  placeholder={`List the sets you're watching this week...

• Set Name (Set Number) — Why it's interesting
• Another Set — Key price points / retirement data
• ...`}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0f0f1a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all resize-y min-h-[120px]"
                />
              </div>

              {/* Generate Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={generateNewsletter}
                className="w-full px-6 py-4 bg-[#E3000B] hover:bg-[#b80009] text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 cursor-pointer flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Newsletter Preview
              </motion.button>
            </motion.div>
          </div>

          {/* ── Preview Area ── */}
          {preview && (
            <motion.div
              ref={previewRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#E3000B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Newsletter Preview
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyHtml}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    copied
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-[#1a1a2e] border border-white/10 text-gray-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy HTML
                    </>
                  )}
                </motion.button>
              </div>

              {/* Rendered preview iframe */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  srcDoc={preview}
                  title="Newsletter Preview"
                  className="w-full h-[700px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Raw HTML toggle */}
              <details className="mt-4">
                <summary className="text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
                  View raw HTML source
                </summary>
                <pre className="mt-3 p-4 bg-[#0a0a14] border border-white/5 rounded-xl text-xs text-gray-400 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-all">
                  {preview}
                </pre>
              </details>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
