import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Add item handling duplicate entries and stock limits
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.inventory_id === product.inventory_id);
        
        if (existingItem) {
          // Graceful failure: Do not exceed available stock
          if (existingItem.quantity >= product.stock) {
            console.warn('[Cart Warning] Stock limit reached for this asset.');
            return; 
          }
          
          set({
            items: currentItems.map(item => 
              item.inventory_id === product.inventory_id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          // Initialize new item with quantity 1
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      
      removeItem: (inventoryId) => {
        set({
          items: get().items.filter(item => item.inventory_id !== inventoryId)
        });
      },
      
      updateQuantity: (inventoryId, newQuantity, availableStock) => {
        if (newQuantity < 1) return;
        if (newQuantity > availableStock) return;
        
        set({
          items: get().items.map(item =>
            item.inventory_id === inventoryId
              ? { ...item, quantity: newQuantity }
              : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      // Derived state computation
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'origin-vault-cart-storage', // Key used in localStorage
    }
  )
);