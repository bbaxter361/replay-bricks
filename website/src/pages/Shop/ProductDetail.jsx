import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, ArrowLeft, Minus, Plus, Check, Calendar, Tag } from 'lucide-react';
import { fetchInventoryItem, fetchInventory } from '../../shopApi';
import { useCart } from '../../contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setQuantity(1);
    setAdded(false);

    Promise.all([
      fetchInventoryItem(id),
      fetchInventory({ limit: 8 }),
    ])
      .then(([detail, browseData]) => {
        if (!detail || !detail.item) {
          setError('Item not found');
          return;
        }
        setItem(detail.item);
        // Show other items as related (exclude current)
        const others = (browseData.items || []).filter(i => i.id !== parseInt(id)).slice(0, 6);
        setRelated(others);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const cartItem = items.find(i => i.inventory_id === item?.id);

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatPrice = (cents) => {
    if (cents === null || cents === undefined) return '—';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-[4/3] bg-[#242424] rounded-2xl border border-[#333]" />
            <div>
              <div className="h-8 bg-[#333] rounded w-1/3 mb-4" />
              <div className="h-5 bg-[#333] rounded w-2/3 mb-3" />
              <div className="h-4 bg-[#333] rounded w-1/4 mb-6" />
              <div className="h-12 bg-[#333] rounded w-1/2 mb-4" />
              <div className="h-4 bg-[#333] rounded w-full mb-2" />
              <div className="h-4 bg-[#333] rounded w-full mb-2" />
              <div className="h-4 bg-[#333] rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Item Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'This part could not be found.'}</p>
          <button
            onClick={() => navigate('/shop/browse')}
            className="px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            ← Browse All Parts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image — larger aspect-[4/3] */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#242424] border border-[#333] rounded-2xl p-8 flex items-center justify-center aspect-[4/3]"
          >
            <img
              src={`/api/images?url=${encodeURIComponent(item.image_url)}`}
              alt={item.part_name}
              className="max-w-full max-h-full object-contain"
              onError={e => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No Image</text></svg>';
              }}
            />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            {/* Badge row: set number, year, condition */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-xs font-bold font-mono uppercase text-gray-400 bg-[#242424] px-2 py-1 rounded border border-[#333]">
                {item.part_no}
              </p>
              {item.year && (
                <span className="text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded border border-gray-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.year}
                </span>
              )}
              <span className={`text-[11px] font-semibold uppercase px-2 py-1 rounded ${
                item.condition === 'NEW'
                  ? 'bg-green-900/40 text-green-400 border border-green-700/30'
                  : 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30'
              }`}>
                {item.condition}
              </span>
            </div>

            {/* Part name */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {item.part_name || 'Unknown Part'}
            </h1>

            {/* Color */}
            {item.color_name && (
              <div className="flex items-center gap-2 mb-4">
                {item.color_code && (
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: `#${item.color_code}` }}
                  />
                )}
                <span className="text-sm text-gray-400">{item.color_name}</span>
              </div>
            )}

            {/* Price */}
            <div className="text-3xl font-bold text-[#E3000B] mb-2">
              {formatPrice(item.unit_price_cents)}
            </div>

            {item.quantity > 0 ? (
              <p className="text-sm text-gray-500 mb-6">
                {item.quantity} in stock
              </p>
            ) : (
              <p className="text-sm text-red-400 mb-6">Out of stock</p>
            )}

            {item.quantity > 0 && (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center bg-[#242424] border border-[#333] rounded-lg text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-white font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(item.quantity, q + 1))}
                    disabled={quantity >= item.quantity}
                    className="w-10 h-10 flex items-center justify-center bg-[#242424] border border-[#333] rounded-lg text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={item.quantity <= 0}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                added
                  ? 'bg-green-600 text-white'
                  : item.quantity <= 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#E3000B] hover:bg-[#b80009] text-white shadow-lg shadow-red-600/25'
              }`}
            >
              {added ? (
                <><Check className="w-4 h-4" /> Added to Cart</>
              ) : (
                <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
              )}
            </button>

            {cartItem && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {cartItem.quantity} in cart
              </p>
            )}

            {/* Full Details Table */}
            <div className="mt-8 space-y-3 pt-6 border-t border-[#333]">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Part Number</span>
                <span className="text-white font-mono font-bold">{item.part_no}</span>
              </div>
              {item.year && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Year Released</span>
                  <span className="text-white">{item.year}</span>
                </div>
              )}
              {item.color_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Color</span>
                  <span className="text-white flex items-center gap-2">
                    {item.color_code && (
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: `#${item.color_code}` }} />
                    )}
                    {item.color_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Condition</span>
                <span className={`font-semibold ${
                  item.condition === 'NEW' ? 'text-green-400' : 'text-yellow-400'
                }`}>{item.condition}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price</span>
                <span className="text-[#E3000B] font-bold">{formatPrice(item.unit_price_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity Available</span>
                <span className="text-white">{item.quantity || 0}</span>
              </div>
              {item.location && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="text-white">{item.location}</span>
                </div>
              )}
            </div>

            {/* Full Description */}
            {item.description && (
              <div className="mt-6 pt-4 border-t border-[#333]">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Description
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Other Parts You Might Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/shop/product/${r.id}`)}
                  className="group bg-[#242424] border border-[#333] hover:border-[#E3000B] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer text-left"
                >
                  <div className="aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center p-3">
                    <img
                      src={`/api/images?url=${encodeURIComponent(r.image_url)}`}
                      alt={r.part_name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold font-mono text-gray-500 truncate">{r.part_no}</p>
                    <p className="text-xs text-white truncate">{r.part_name || 'Unknown'}</p>
                    <p className="text-xs text-[#E3000B] font-semibold mt-1">
                      {formatPrice(r.unit_price_cents)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
