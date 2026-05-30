"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import CartDrawer from '@/components/CartDrawer';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Zustand State
  const addItem = useCartStore((state) => state.addItem);
  const getCartCount = useCartStore((state) => state.getCartCount);

  useEffect(() => {
    setIsMounted(true); // Hydration fix
    const loadCatalog = async () => {
      try {
        const res = await fetchAPI('/inventory');
        setInventory(res.data);
      } catch (error) {
        console.error('[Catalog Error] Failed to fetch active inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalog();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 relative">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Origin Vault
          </h1>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative px-6 py-2 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded font-bold text-slate-300 transition-colors flex items-center gap-3 group"
        >
          <span className="uppercase tracking-widest text-xs">Ledger</span>
          <div className="bg-slate-800 group-hover:bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 transition-colors">
            {isMounted ? getCartCount() : 0}
          </div>
        </button>
      </header>

      {/* Catalog Grid */}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-slate-100 mb-2">Active Catalog</h2>
          <p className="text-slate-500 uppercase tracking-widest text-sm">Secure TCG Acquisitions</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
            <p className="text-slate-500">No active assets in the vault.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inventory.map((item) => (
              <div 
                key={item.inventory_id} 
                className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-colors group"
              >
                {/* Visual Placeholder for Card Image */}
                <div className="h-48 bg-slate-950 flex items-center justify-center border-b border-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                  <span className="text-slate-700 font-bold uppercase tracking-widest text-2xl group-hover:scale-110 transition-transform duration-500">
                    {item.card_name.substring(0, 3)}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-200 mb-1">{item.card_name}</h3>
                  
                  <div className="flex gap-2 mb-4">
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded font-semibold">
                      {item.condition}
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded font-semibold">
                      {item.language}
                    </span>
                  </div>
                  
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Market Value</p>
                      <p className="text-2xl font-mono font-bold text-emerald-400">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        addItem(item);
                        setIsCartOpen(true);
                      }}
                      disabled={item.stock === 0}
                      className="px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.stock === 0 ? 'Depleted' : 'Acquire'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer Component */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
    </main>
  );
}