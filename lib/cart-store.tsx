import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartId: string;
  productId: number;
  name: string;
  price: number;
  temperature?: 'Hot' | 'Ice';
  iceLevel?: 'Normal' | 'Less Ice' | 'Extra Ice';
  sugarLevel?: 'Normal' | 'Less Sugar' | 'Extra Sweet' | 'No Sugar';
  addons: CartAddon[];
  notes: string;
  quantity: number;
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartId' | 'subtotal'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: Omit<CartItem, 'cartId' | 'subtotal'>) => {
    const addonsTotal = newItem.addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = newItem.price + addonsTotal;
    const subtotal = unitPrice * newItem.quantity;
    const cartId = `${newItem.productId}-${newItem.temperature}-${newItem.iceLevel}-${newItem.sugarLevel}-${newItem.addons
      .map((a) => a.id)
      .join('-')}-${newItem.notes}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.cartId === cartId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: unitPrice * newQty,
        };
        return updated;
      }
      return [...prevItems, { ...newItem, cartId, subtotal }];
    });
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.cartId === cartId) {
          const addonsTotal = i.addons.reduce((sum, a) => sum + a.price, 0);
          const unitPrice = i.price + addonsTotal;
          return {
            ...i,
            quantity,
            subtotal: unitPrice * quantity,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
