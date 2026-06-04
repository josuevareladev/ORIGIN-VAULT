"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import CartDrawer from '@/components/CartDrawer';
import ExpandableArtCard from '@/components/ExpandableArtCard';
import OrganicBreadcrumb from '@/components/OrganicBreadcrumb';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const getCartCount = useCartStore((state) => state.getCartCount);

  useEffect(() => {
    setIsMounted(true);
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

  const handleAcquire = (item) => {
    addItem(item);
    setIsCartOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#050B14] text-slate-200 relative selection:bg-cyan-500/30">
      
      {/* Castelia Standard Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-slate-800/50 supports-[backdrop-filter]:bg-[#050B14]/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-slate-950 font-black text-xs tracking-tighter">OV</span>
            </div>
            <h1 className="text-xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
              Origin Vault
            </h1>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative px-6 py-2 bg-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 rounded-full font-bold text-slate-300 transition-all duration-300 flex items-center gap-3 group hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]"
          >
            <span className="uppercase tracking-widest text-[10px]">Secure Ledger</span>
            <div className="bg-slate-800 group-hover:bg-cyan-500/20 px-2 py-1 rounded-full text-cyan-400 transition-colors text-xs font-mono">
              {isMounted ? getCartCount() : 0}
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Arena */}
      <div className="p-8 max-w-7xl mx-auto min-h-[80vh]">
        <OrganicBreadcrumb paths={[{ label: 'Active Catalog' }]} />

        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-4 tracking-tight">
            Curated Acquisitions.
          </h2>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest max-w-xl leading-relaxed">
            Cryptographically secured assets. Browse the current global inventory of the Origin Vault.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-r-2 border-emerald-500 rounded-full animate-spin-reverse"></div>
            </div>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-32 border border-slate-800/50 border-dashed rounded-3xl bg-slate-900/20 backdrop-blur-sm">
            <p className="text-slate-500 font-mono uppercase tracking-widest">No active assets in the vault.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {inventory.map((item) => (
              <ExpandableArtCard 
                key={item.inventory_id} 
                item={item} 
                onAcquire={handleAcquire} 
              />
            ))}
          </div>
        )}
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
    </main>
  );
}