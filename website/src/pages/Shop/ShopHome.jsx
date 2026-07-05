import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { fetchInventory } from '../../shopApi';

const CATEGORIES = [
  { name: 'All Parts', icon: Package, filter: '' },
  { name: 'New', icon: Sparkles, filter: 'NEW' },
  { name: 'Used', icon: Package, filter: 'USED' },
];

export default function ShopHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory({ limit: 12 })
      .then(data => setFeatured(data.items || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop/browse?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-[#E3000B] rounded-2xl rotate-12" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-[#E3000B] rounded-2xl -rotate-6" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-[#E3000B] rounded-lg opacity-10" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Shop{' '}
              <span className="text-[#E3000B]">With Us</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Premium LEGO parts and sets — new and used. Every brick inspected, cleaned, and ready to ship.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by part name or number..."
                  className="w-full pl-12 pr-4 py-3.5 bg-[#242424] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E3000B] focus:ring-1 focus:ring-[#E3000B]/30 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#E3000B] hover:bg-[#b80009] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Browse By Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => navigate(cat.filter ? `/shop/browse?condition=${cat.filter}` : '/shop/browse')}
              className="group bg-[#242424] border border-[#333] hover:border-[#E3000B] rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
            >
              <cat.icon className="w-8 h-8 mx-auto mb-3 text-[#E3000B] group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold">{cat.name}</h3>
            </motion.button>
          ))}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/shop/browse')}
            className="group bg-[#242424] border border-[#333] hover:border-[#D4A843] rounded-xl p-6 text-center transition-all duration-300 cursor-pointer"
          >
            <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-[#D4A843] group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold">All Items</h3>
          </motion.button>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Featured Parts</h2>
          <button
            onClick={() => navigate('/shop/browse')}
            className="text-sm text-[#E3000B] hover:text-[#ff1a25] font-medium transition-colors cursor-pointer"
          >
            Browse All →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#242424] border border-[#333] rounded-xl p-4 animate-pulse">
                <div className="aspect-square bg-[#333] rounded-lg mb-3" />
                <div className="h-4 bg-[#333] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#333] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No inventory available yet. Items will appear here once synced.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                onClick={() => navigate(`/shop/product/${item.id}`)}
                className="group bg-[#242424] border border-[#333] hover:border-[#E3000B] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer text-left"
              >
                <div className="aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center p-4 relative overflow-hidden">
                  <img
                    src={`/api/images?url=${encodeURIComponent(item.image_url)}`}
                    alt={item.part_name || item.part_no}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <span className="hidden absolute inset-0 items-center justify-center text-5xl opacity-30">🧱</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wide">{item.part_no}</p>
                  <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight mt-0.5 min-h-[2.5em]">
                    {item.part_name || `LEGO ${item.part_no}`}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
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
                  {item.color_name && (
                    <p className="text-[11px] text-gray-500 mt-1">{item.color_name}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
