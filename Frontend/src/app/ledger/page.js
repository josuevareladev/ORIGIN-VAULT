"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import OrganicBreadcrumb from '@/components/OrganicBreadcrumb';

export default function Ledger() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetchAPI('/orders/me');
        setOrders(response.data);
      } catch (err) {
        setError('Failed to retrieve the ledger records. Ensure you are authenticated.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-[#050B14] text-slate-200 selection:bg-cyan-500/30">
      
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-slate-800/50 supports-[backdrop-filter]:bg-[#050B14]/60 px-8 py-4 flex justify-between items-center transition-all duration-300">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 flex items-center justify-center transition-all duration-300">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </div>
          <h1 className="text-sm font-black tracking-widest uppercase text-slate-400 group-hover:text-cyan-400 transition-colors">
            Return to Catalog
          </h1>
        </Link>
      </header>

      <div className="p-8 max-w-5xl mx-auto min-h-[80vh]">
        <OrganicBreadcrumb paths={[{ label: 'Personal Ledger' }]} />

        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-100 mb-4 tracking-tight">Acquisition History.</h2>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest max-w-xl leading-relaxed">
            Cryptographic record of your transactions within the Origin Vault.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-r-2 border-emerald-500 rounded-full animate-spin-reverse"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32 border border-slate-800/50 border-dashed rounded-3xl bg-slate-900/20 backdrop-blur-sm">
            <p className="text-slate-500 font-mono uppercase tracking-widest">No records found in the ledger.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-slate-700 transition-colors">
                
                <div className="px-6 py-4 border-b border-slate-800/50 flex flex-wrap justify-between items-center gap-4 bg-[#050B14]/40">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Transaction ID</p>
                    <p className="font-mono text-xs text-cyan-400">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Date</p>
                    <p className="font-mono text-sm text-slate-300">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Status</p>
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border ${
                      order.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Allocated</p>
                    <p className="font-mono text-lg font-bold text-emerald-400">${parseFloat(order.total).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/50 px-4 py-3 rounded-lg border border-slate-800/30">
                        <div>
                          <p className="font-bold text-slate-200 text-sm">{item.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">{item.condition}</span>
                            <span className="text-[10px] text-slate-600 uppercase">•</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">{item.language}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-slate-400">
                            {item.quantity}x @ ${parseFloat(item.price_at_purchase).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}