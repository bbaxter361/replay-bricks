import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

const CART_KEY = 'replaybrick_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.inventory_id === product.id
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, {
        inventory_id: product.id,
        part_no: product.part_no,
        part_name: product.part_name,
        color_name: product.color_name,
        color_code: product.color_code,
        condition: product.condition,
        unit_price_cents: product.unit_price_cents,
        image_url: product.image_url,
        quantity,
      }];
    });
  }, []);

  const updateQuantity = useCallback((inventoryId, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.inventory_id !== inventoryId));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.inventory_id === inventoryId ? { ...i, quantity } : i
      )
    );
  }, []);

  const removeItem = useCallback((inventoryId) => {
    setItems(prev => prev.filter(i => i.inventory_id !== inventoryId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + (i.unit_price_cents || 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQuantity, removeItem, clearCart,
      itemCount, subtotalCents,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
