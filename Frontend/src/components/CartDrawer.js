"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { fetchAPI } from '@/lib/api';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setCheckoutStatus(null);

    // Format payload: The backend only needs IDs and quantities. It will calculate prices itself.
    const payload = {
      items: items.map(item => ({
        inventory_id: item.inventory_id,
        quantity: item.quantity
      }))
    };

    try {
      await fetchAPI('/checkout', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setCheckoutStatus('success');
      clearCart();
      
      // Auto-close drawer and reload page after a short delay to reflect new stock
      setTimeout(() => {
        onClose();
        setCheckoutStatus(null);
        window.location.reload();
      }, 2500);

    } catch (error) {
      setCheckoutStatus('error');
      setErrorMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <section className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">
              Secure Ledger
            </h2>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="text-slate-400 hover:text-red-400 transition-colors p-2 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {checkoutStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Transaction Sealed</h3>
                <p className="text-slate-400 text-sm">Stock has been successfully deducted from the vault.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">
                <p>The ledger is currently empty.</p>
                <p className="text-sm mt-2">Initialize a transaction from the catalog.</p>
              </div>
            ) : (
              <>
                {checkoutStatus === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium mb-4">
                    {errorMessage}
                  </div>
                )}
                {items.map((item) => (
                  <div key={item.inventory_id} className="flex gap-4 p-4 border border-slate-800 rounded-lg bg-slate-950/50 relative">
                    <button 
                      onClick={() => removeItem(item.inventory_id)}
                      disabled={isProcessing}
                      className="absolute -top-2 -right-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full p-1 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>

                    <div className="flex-1">
                      <h3 className="text-slate-200 font-bold">{item.card_name}</h3>
                      <p className="text-xs text-slate-400 uppercase mt-1">
                        {item.condition} • {item.language}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-slate-700 rounded bg-slate-900">
                          <button 
                            onClick={() => updateQuantity(item.inventory_id, item.quantity - 1, item.stock)}
                            className="px-3 py-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            disabled={item.quantity <= 1 || isProcessing}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-sm font-mono text-emerald-400 border-x border-slate-700">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.inventory_id, item.quantity + 1, item.stock)}
                            className="px-3 py-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            disabled={item.quantity >= item.stock || isProcessing}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-mono text-slate-400">@ ${parseFloat(item.price).toFixed(2)}</p>
                          <p className="text-lg font-bold text-cyan-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {items.length > 0 && checkoutStatus !== 'success' && (
            <div className="border-t border-slate-800 p-6 bg-slate-950">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 uppercase tracking-widest text-sm font-bold">Total Allocation</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex justify-center items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Protocol...
                  </>
                ) : (
                  'Confirm Transaction'
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}