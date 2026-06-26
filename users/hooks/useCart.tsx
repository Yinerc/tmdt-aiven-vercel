'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: number;
  name?: string;
  tensanpham?: string;
  price?: number;
  gia?: number;
  image?: string;
  hinhanh?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load từ localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Lỗi load giỏ hàng từ localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Lưu vào localStorage khi cart thay đổi
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.name || product.tensanpham,
          price: product.price || product.gia,
          image: product.image || product.hinhanh,
          quantity: 1,
        }];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = Number(item.price || item.gia || 0);
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};