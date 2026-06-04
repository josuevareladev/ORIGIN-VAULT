"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';
import OrganicBreadcrumb from '@/components/OrganicBreadcrumb';

function SuccessProcessor() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setErrorMessage('No valid transaction reference found.');
      return;
    }

    const sealTransaction = async () => {
      try {
        await fetchAPI('/checkout/finalize', {
          method: 'POST',
          body: JSON.stringify({ order_id: orderId })
        });
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to cryptographically seal the transaction.');
      }
    };

    sealTransaction();
  }, [orderId]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {status === 'processing' && (
        <>
          <div className="relative w-16 h-16 mb-8">
            <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-r-2 border-emerald-500 rounded-full animate-spin-reverse"></div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-300">Sealing Transaction...</h2>
          <p className="text-slate-500 font-mono text-sm mt-2">Deducting assets from the vault.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full border border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center mb-8 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-emerald-400">Transaction Sealed</h2>
          <p className="text-slate-400 font-mono text-sm mt-4 max-w-md mx-auto">
            Your assets have been successfully secured and deducted from the global inventory.
          </p>
          <div className="mt-10 flex gap-4">
            <Link 
              href="/ledger" 
              className="px-6 py-3 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 font-bold uppercase tracking-widest text-xs rounded transition-all"
            >
              View Personal Ledger
            </Link>
            <Link 
              href="/" 
              className="px-6 py-3 bg-emerald-600/10 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-bold uppercase tracking-widest text-xs rounded transition-all"
            >
              Return to Catalog
            </Link>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
           <div className="w-16 h-16 rounded-full border border-red-500/50 bg-red-500/10 flex items-center justify-center mb-8">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-red-400">Transaction Error</h2>
          <p className="text-slate-400 font-mono text-sm mt-4 max-w-md mx-auto">{errorMessage}</p>
          <Link 
            href="/ledger" 
            className="mt-10 px-6 py-3 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 font-bold uppercase tracking-widest text-xs rounded transition-all"
          >
            Review Ledger Status
          </Link>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#050B14] text-slate-200">
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-slate-800/50 px-8 py-4">
        <h1 className="text-xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
          Origin Vault
        </h1>
      </header>
      
      <div className="p-8 max-w-4xl mx-auto">
        <OrganicBreadcrumb paths={[{ label: 'Transaction Verification' }]} />
        <Suspense fallback={<div className="text-center text-slate-500 mt-20 uppercase tracking-widest font-mono text-sm">Initializing Secure Connection...</div>}>
          <SuccessProcessor />
        </Suspense>
      </div>
    </main>
  );
}