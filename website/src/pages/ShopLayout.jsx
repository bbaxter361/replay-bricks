import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import Footer from '../components/Footer';

export default function ShopLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Shop Nav */}
      <nav className="sticky top-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/shop" className="flex items-center gap-2 group">
              <svg viewBox="0 0 48 40" className="w-8 h-7 flex-shrink-0">
                <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
                <circle cx="10" cy="20" r="2" fill="#FFD700"/>
                <circle cx="20" cy="20" r="2" fill="#FFD700"/>
                <circle cx="30" cy="20" r="2" fill="#FFD700"/>
                <circle cx="40" cy="20" r="2" fill="#FFD700"/>
              </svg>
              <span className="font-anton text-lg text-white tracking-wider">
                REPLAY<span className="text-[#E3000B]">.</span>BRICKS
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-widest text-[#E3000B] bg-[#E3000B]/10 px-2 py-0.5 rounded-full ml-1">
                Shop
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/shop"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  location.pathname === '/shop'
                    ? 'text-white bg-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Home
              </Link>
              <Link
                to="/shop/browse"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  location.pathname.startsWith('/shop/browse')
                    ? 'text-white bg-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Browse
              </Link>
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Main Site
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link
                to="/shop/cart"
                className="relative p-2.5 bg-[#242424] border border-[#333] rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#E3000B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Shop Footer */}
      <footer className="bg-[#0f0f1a] border-t border-[#333] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 48 40" className="w-6 h-5">
                <rect x="2" y="12" width="44" height="24" rx="3" fill="#E3000B"/>
                <circle cx="10" cy="20" r="1.5" fill="#FFD700"/>
                <circle cx="20" cy="20" r="1.5" fill="#FFD700"/>
                <circle cx="30" cy="20" r="1.5" fill="#FFD700"/>
                <circle cx="40" cy="20" r="1.5" fill="#FFD700"/>
              </svg>
              <span className="text-sm text-gray-500">
                © {new Date().getFullYear()} Replay Bricks
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
              <Link to="/shop/browse" className="hover:text-white transition-colors">Browse</Link>
              <Link to="/shop/cart" className="hover:text-white transition-colors">Cart</Link>
              <Link to="/" className="hover:text-white transition-colors">Main Site</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
