import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, CreditCard, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../shopApi';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotalCents, clearCart } = useCart();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.email.includes('@')) return 'Valid email is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!form.zip.trim()) return 'ZIP code is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const shippingAddress = [
        form.address,
        `${form.city}, ${form.state} ${form.zip}`,
        form.country,
      ].join(', ');

      const orderData = {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || undefined,
        shipping_address: shippingAddress,
        items: items.map(i => ({
          inventory_id: i.inventory_id,
          quantity: i.quantity,
          part_no: i.part_no,
          part_name: i.part_name,
          unit_price_cents: i.unit_price_cents,
        })),
        marketplace: 'replaybrick',
        status: 'paid',
        shipping_cents: shippingCents,
        total_price_cents: totalCents,
      };

      const result = await createOrder(orderData);
      setOrderResult(result);
      clearCart();
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
  
  // Flat rate USPS shipping
  const SHIPPING_FLAT_RATE_CENTS = 599; // $5.99
  const shippingCents = items.length > 0 ? SHIPPING_FLAT_RATE_CENTS : 0;
  const totalCents = subtotalCents + shippingCents;

  // Order confirmed
  if (orderResult) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-20">
        <div className="max-w-lg mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-600/20 border border-green-600/30 rounded-2xl flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-2">
            Thank you for your order, {form.name.split(' ')[0]}!
          </p>
          <p className="text-sm text-gray-500 mb-8">
            A confirmation will be sent to <span className="text-white">{form.email}</span>
          </p>

          <div className="bg-[#242424] border border-[#333] rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#333]">
              <span className="text-sm text-gray-400">Order #{orderResult.order?.id || orderResult.id}</span>
              <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded font-semibold uppercase">
                Confirmed
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.inventory_id} className="flex justify-between text-sm">
                  <span className="text-gray-400 truncate max-w-[70%]">
                    {item.quantity}x {item.part_name || item.part_no}
                  </span>
                  <span className="text-white">
                    {formatPrice((item.unit_price_cents || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#333] pt-3 flex justify-between font-bold">
              <span className="text-white">Total Paid</span>
              <span className="text-[#E3000B]">{formatPrice(subtotalCents)}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-[#333]">
              <p className="text-xs text-gray-500 mb-1">Shipping to:</p>
              <p className="text-sm text-white">{form.name}</p>
              <p className="text-sm text-gray-400">{form.address}</p>
              <p className="text-sm text-gray-400">{form.city}, {form.state} {form.zip}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/shop/browse')}
              className="px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-[#242424] border border-[#333] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl transition-all cursor-pointer"
            >
              Back to Shop Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
          <p className="text-gray-400 mb-6">Add some parts to your cart first.</p>
          <button
            onClick={() => navigate('/shop/browse')}
            className="px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Browse Parts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate('/shop/cart')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
          {/* Shipping Form */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-[#242424] border border-[#333] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#E3000B]" />
                Shipping Information
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                      placeholder="555-0123"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={handleChange('address')}
                    className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={handleChange('city')}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                      placeholder="Portland"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">State *</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={handleChange('state')}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                      placeholder="OR"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">ZIP *</label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={handleChange('zip')}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E3000B] transition-colors"
                      placeholder="97201"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-[#242424] border border-[#333] rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.inventory_id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center p-1 flex-shrink-0">
                      <img
                        src={`/api/images?url=${encodeURIComponent(item.image_url)}`}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{item.part_name || item.part_no}</p>
                      <p className="text-[10px] text-gray-500">{item.quantity}x</p>
                    </div>
                    <span className="text-xs text-white font-semibold">
                      {formatPrice((item.unit_price_cents || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#333] pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">{formatPrice(shippingCents)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#333]">
                  <span className="text-white">Total</span>
                  <span className="text-[#E3000B]">{formatPrice(totalCents)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800/40 rounded-lg">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  submitting
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#E3000B] hover:bg-[#b80009] text-white shadow-lg shadow-red-600/25'
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-600 mt-3 text-center">
                By placing this order, you agree to our terms and conditions.
                You will receive an email confirmation once the order is processed.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
