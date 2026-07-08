import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const incrementItem = useCallback((itemId) => {
    setCartItems((prev) =>
      prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)
    );
  }, []);

  const decrementItem = useCallback((itemId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item && item.quantity <= 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  }, []);

  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price.replace(/[^\d]/g, "")) * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? 49 : 0;
    const tax = Math.round(subtotal * 0.05);
    return { items: cartItems, subtotal, deliveryFee, tax, total: subtotal + deliveryFee + tax };
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ cartSummary, addToCart, removeFromCart, incrementItem, decrementItem, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
