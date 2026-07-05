import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, Package } from 'lucide-react';

export default function OrderConfirm() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  // In a full implementation we'd fetch order details from the API
  // For now we show a static confirmation

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-20">
      <div className="max-w-lg mx-auto px-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 bg-green-600/20 border border-green-600/30 rounded-2xl flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-green-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          {orderId && (
            <p className="text-sm text-gray-400 mb-2">
              Order <span className="text-white font-mono">#{orderId}</span>
            </p>
          )}
          <p className="text-gray-500 mb-8">
            Thank you for your purchase. You'll receive an email confirmation shortly with your order details and shipping updates.
          </p>

          <div className="bg-[#242424] border border-[#333] rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#333]">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-[#E3000B]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">What happens next?</p>
                <p className="text-xs text-gray-500">We'll process your order and send updates to your email.</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm text-left">
              {[
                'Order received and confirmed',
                'Items picked from inventory',
                'Quality checked and packed',
                'Shipped with tracking',
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/shop/browse')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E3000B] hover:bg-[#b80009] text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-[#242424] border border-[#333] text-gray-300 hover:text-white hover:border-gray-500 rounded-xl transition-all cursor-pointer"
            >
              Back to Shop Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
