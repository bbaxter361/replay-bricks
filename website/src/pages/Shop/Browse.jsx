import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Package, ChevronDown, X } from 'lucide-react';
import { fetchInventory } from '../../shopApi';

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [conditionFilter, setConditionFilter] = useState(searchParams.get('condition') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 48;

  useEffect(() => {
    loadItems();
  }, [page, conditionFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory({ search: search || undefined, condition: conditionFilter || undefined, page, limit });
      let sorted = [...(data.items || [])];
      if (sortBy === 'price-asc') sorted.sort((a, b) => (a.unit_price_cents || 0) - (b.unit_price_cents || 0));
      else if (sortBy === 'price-desc') sorted.sort((a, b) => (b.unit_price_cents || 0) - (a.unit_price_cents || 0));
      else if (sortBy === 'name') sorted.sort((a, b) => (a.part_name || '').localeCompare(b.part_name || ''));
      setItems(sorted);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadItems();
  };

  const clearFilters = () => {
    setConditionFilter('');
    setSearch('');
    setPage(1);
  };

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  const hasFilters = conditionFilter || search;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#1a1a1a]/95 backdrop-blur-lg border-b border-[#333]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search parts..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#242424] border border-[#333] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E3000B] transition-colors"
              />
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                showFilters || hasFilters
                  ? 'bg-[#E3000B]/10 border-[#E3000B]/30 text-[#E3000B]'
                  : 'bg-[#242424] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setTimeout(loadItems, 0); }}
              className="bg-[#242424] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#E3000B] cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex flex-wrap gap-2"
            >
              <button
                onClick={() => setConditionFilter(conditionFilter === 'NEW' ? '' : 'NEW')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  conditionFilter === 'NEW'
                    ? 'bg-green-900/30 border-green-600/40 text-green-400'
                    : 'bg-[#242424] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                New
              </button>
              <button
                onClick={() => setConditionFilter(conditionFilter === 'USED' ? '' : 'USED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  conditionFilter === 'USED'
                    ? 'bg-yellow-900/30 border-yellow-600/40 text-yellow-400'
                    : 'bg-[#242424] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                Used
              </button>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E3000B]/30 text-[#E3000B] hover:bg-[#E3000B]/10 transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Searching...' : `${total} item${total !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#242424] border border-[#333] rounded-xl p-4 animate-pulse">
                <div className="aspect-[4/3] bg-[#333] rounded-lg mb-3" />
                <div className="h-4 bg-[#333] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#333] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-gray-400 mb-1">No items found</h3>
            <p className="text-sm">Try adjusting your search or filters.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-[#E3000B] hover:bg-[#b80009] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.3 }}
                  onClick={() => navigate(`/shop/product/${item.id}`)}
                  className="group bg-[#242424] border border-[#333] hover:border-[#E3000B] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer text-left"
                >
                  {/* Image — aspect-[4/3] for large set image */}
                  <div className="aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center p-4 relative overflow-hidden">
                    <img
                      src={`/api/images?url=${encodeURIComponent(item.image_url)}`}
                      alt={item.part_name || item.part_no}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <span className="hidden absolute inset-0 items-center justify-center text-5xl opacity-30">🧱</span>
                    {/* Year badge */}
                    {item.year && (
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {item.year}
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    {/* LEGO set number — bold, monospace */}
                    <p className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wide">
                      {item.part_no}
                    </p>
                    {/* Part name — 2 lines max */}
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight min-h-[2.5em]">
                      {item.part_name || `LEGO ${item.part_no}`}
                    </h3>
                    {/* Description — 1 line, gray */}
                    {item.description && (
                      <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
                    )}
                    {/* Price + Condition */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#E3000B] font-bold text-sm">
                        {formatPrice(item.unit_price_cents)}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        item.condition === 'NEW'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-2 bg-[#242424] border border-[#333] rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  let p;
                  if (pages <= 7) {
                    p = i + 1;
                  } else if (page <= 4) {
                    p = i + 1;
                  } else if (page >= pages - 3) {
                    p = pages - 6 + i;
                  } else {
                    p = page - 3 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        page === p
                          ? 'bg-[#E3000B] text-white'
                          : 'bg-[#242424] border border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-2 bg-[#242424] border border-[#333] rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
