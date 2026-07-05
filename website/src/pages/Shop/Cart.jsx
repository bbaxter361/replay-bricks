import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart as CartIcon, Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, itemCount, subtotalCents } = useCart();

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#242424] border border-[#333] rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
          <p className="text-gray-400 mb-8">Start adding parts to your cart from the store.</p>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Parts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/shop/browse')}
              className="p-2 bg-[#242424] border border-[#333] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CartIcon className="w-5 h-5 text-[#E3000B]" />
              Cart ({itemCount})
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-[#E3000B] transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <motion.div
              key={item.inventory_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-[#242424] border border-[#333] rounded-xl p-4 flex items-center gap-4"
            >
              {/* Image */}
              <div
                onClick={() => navigate(`/shop/product/${item.inventory_id}`)}
                className="w-20 h-20 bg-[#1a1a1a] rounded-lg flex items-center justify-center p-2 flex-shrink-0 cursor-pointer"
              >
                <img
                  src={`/api/images?url=${encodeURIComponent(item.image_url)}`}
                  alt={item.part_name}
                  className="max-w-full max-h-full object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-mono uppercase">{item.part_no}</p>
                <h3
                  onClick={() => navigate(`/shop/product/${item.inventory_id}`)}
                  className="text-sm font-semibold text-white truncate cursor-pointer hover:text-[#E3000B] transition-colors"
                >
                  {item.part_name || 'Unknown Part'}
                </h3>
                {item.color_name && (
                  <p className="text-xs text-gray-500">{item.color_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    item.condition === 'NEW'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {item.condition}
                  </span>
                  <span className="text-sm font-semibold text-[#E3000B]">
                    {formatPrice(item.unit_price_cents)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-white font-semibold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[80px]">
                <p className="text-sm font-semibold text-white">
                  {formatPrice((item.unit_price_cents || 0) * item.quantity)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.inventory_id)}
                className="p-2 text-gray-500 hover:text-[#E3000B] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-[#242424] border border-[#333] rounded-xl p-6">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal ({itemCount} items)</span>
              <span className="text-white">{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shipping</span>
              <span className="text-gray-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-[#333] pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Estimated Total</span>
              <span className="text-[#E3000B]">{formatPrice(subtotalCents)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/shop/checkout')}
            className="w-full mt-4 py-3.5 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 cursor-pointer"
          >
            Proceed to Checkout
          </button>
          <button
            onClick={() => navigate('/shop/browse')}
            className="w-full mt-2 py-3 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
