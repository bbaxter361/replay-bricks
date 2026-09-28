// Spring Brain Module — Shared Memory for Spring + Vicki + Amy
// Stores durable memories in Netlify Blobs using OSB-compatible format.
// Format: { topic, principle, signal, source, agent, created_at, metadata }

const BRAIN_KEY = 'spring_brain_memories';
const MAX_MEMORIES = 500; // Bound storage

/**
 * @param {Map|import('@netlify/blobs').Store} store - Netlify Blobs store or Map fallback
 * @returns {Promise<Array>} All stored memories
 */
export async function getAllMemories(store) {
  try {
    if (store instanceof Map) {
      const raw = store.get(BRAIN_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    const data = await store.get(BRAIN_KEY, { type: 'json' });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Brain read failed:', e.message);
    return [];
  }
}

/**
 * Replace the entire memory store with a new array (used by cleanup/dedup).
 * @param {Map|import('@netlify/blobs').Store} store
 * @param {Array} memories - Full array to store
 */
export async function saveAllMemories(store, memories) {
  try {
    if (store instanceof Map) {
      store.set(BRAIN_KEY, JSON.stringify(memories));
    } else {
      await store.setJSON(BRAIN_KEY, memories);
    }
    return { saved: true, count: memories.length };
  } catch (e) {
    console.warn('Brain saveAll failed:', e.message);
    return { saved: false, reason: e.message };
  }
}

/**
 * Save a new memory to the brain.
 * @param {Map|import('@netlify/blobs').Store} store
 * @param {Object} memory - { topic, principle, signal, source, agent, metadata? }
 */
export async function saveMemory(store, memory) {
  try {
    const memories = await getAllMemories(store);
    
    // Check for near-duplicate (same topic + similar principle — threshold 0.55)
    const isDuplicate = memories.some(m =>
      m.topic === memory.topic &&
      combinedSimilarity(m, memory) > 0.55
    );
    if (isDuplicate) return { saved: false, reason: 'duplicate' };

    const entry = {
      topic: memory.topic || 'general',
      principle: memory.principle || '',
      signal: memory.signal || 'positive',
      source: memory.source || 'spring-chat',
      agent: memory.agent || 'spring',
      created_at: new Date().toISOString(),
      metadata: memory.metadata || {},
    };

    memories.push(entry);
    const trimmed = memories.length > MAX_MEMORIES ? memories.slice(-MAX_MEMORIES) : memories;

    if (store instanceof Map) {
      store.set(BRAIN_KEY, JSON.stringify(trimmed));
    } else {
      await store.setJSON(BRAIN_KEY, trimmed);
    }
    return { saved: true, entry };
  } catch (e) {
    console.warn('Brain save failed:', e.message);
    return { saved: false, reason: e.message };
  }
}

/**
 * Simple word-overlap similarity for duplicate detection.
 * Threshold 0.55 (lowered from 0.7 to catch more near-duplicates).
 * Exported so spring.js can use it for pre-save dedup checks.
 */
export function similarityScore(a, b) {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  return intersection / Math.min(wordsA.size, wordsB.size);
}

/**
 * Combined similarity comparing principle text AND topic.
 * Returns a weighted score: 60% principle similarity + 40% topic similarity.
 */
function combinedSimilarity(memA, memB) {
  if (!memA || !memB) return 0;
  const principleSim = similarityScore(memA.principle, memB.principle);
  const topicSim = similarityScore(memA.topic, memB.topic);
  return principleSim * 0.6 + topicSim * 0.4;
}

/**
 * Search memories by keyword relevance to a query.
 * @returns {Promise<Array>} Ranked list of matching memories
 */
export async function searchMemories(store, queryText, limit = 5) {
  const memories = await getAllMemories(store);
  if (!memories.length || !queryText) return [];

  const queryWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (!queryWords.length) return memories.slice(-limit);

  const scored = memories.map(m => {
    const text = `${m.topic} ${m.principle} ${JSON.stringify(m.metadata)}`.toLowerCase();
    const score = queryWords.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
    return { memory: m, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory);
}

/**
 * Format memories for injection into the system prompt.
 */
export function formatMemoriesForPrompt(memories) {
  if (!memories.length) return '';
  return memories.map(m => {
    const when = m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'earlier';
    return `[Memory · ${when}] ${m.principle}`;
  }).join('\n');
}

/**
 * Export all memories to a single Obsidian-friendly markdown string,
 * organized by topic (alphabetical), entries sorted newest-first within each topic.
 * @param {Array} memories - Array of memory objects
 * @returns {string} Markdown document
 */
export function exportToMarkdown(memories) {
  if (!memories || !memories.length) {
    const today = new Date().toISOString().split('T')[0];
    return `# Spring's Brain — Last Updated: ${today}\n\n_No memories stored._`;
  }

  const today = new Date().toISOString().split('T')[0];
  let md = `# Spring's Brain — Last Updated: ${today}\n`;

  // Group by topic
  const byTopic = {};
  for (const m of memories) {
    const topic = m.topic || 'general';
    if (!byTopic[topic]) byTopic[topic] = [];
    byTopic[topic].push(m);
  }

  // Sort topics alphabetically
  const sortedTopics = Object.keys(byTopic).sort((a, b) => a.localeCompare(b));

  for (const topic of sortedTopics) {
    md += `\n## ${topic}\n`;
    // Sort entries by date, newest first
    const entries = byTopic[topic].slice().sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
    for (const m of entries) {
      const date = m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : 'unknown';
      md += `- [${date}] ${m.principle || ''}\n`;
    }
  }

  return md;
}

/**
 * Remove near-duplicate memories (same topic + similarity > 0.55), keeping the newest.
 * @param {Array} memories - Array of memory objects
 * @returns {Array} Deduplicated array
 */
export function deduplicateMemories(memories) {
  if (!memories || !memories.length) return [];

  // Sort by created_at descending (newest first) so we keep the newest
  const sorted = memories.slice().sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });

  const kept = [];
  for (const mem of sorted) {
    const isDup = kept.some(k =>
      k.topic === mem.topic &&
      combinedSimilarity(k, mem) > 0.55
    );
    if (!isDup) kept.push(mem);
  }

  return kept;
}

/**
 * Build a prompt for the LLM to extract memories from a conversation.
 */
export function buildExtractionPrompt(conversationSummary) {
  return `You are a memory extraction system. Analyze this conversation and extract KEY FACTS, PREFERENCES, and DECISIONS that should be remembered long-term.

For each important finding, output a JSON object on its own line:
{"topic": "kebab-case-topic", "principle": "One sentence describing what was learned or decided", "signal": "positive"}

Rules:
- Only extract things that matter beyond this conversation
- Preferences Amanda expresses (likes, dislikes, how she wants things done)
- Facts about residents, staff, schedules, or the facility
- Decisions made or changes to standard practice
- Skip trivial chitchat
- Maximum 5 findings per extraction

Conversation:
${conversationSummary}`;
}
