"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    card_id: '',
    condition: 'Near Mint',
    language: 'English',
    price: '',
    cost: '',
    stock: ''
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem('origin_vault_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch both cards (for the dropdown) and current inventory concurrently
        const [cardsResponse, inventoryResponse] = await Promise.all([
          fetchAPI('/cards'),
          fetchAPI('/inventory')
        ]);
        
        setCards(cardsResponse.data);
        setInventory(inventoryResponse.data);
        
        // Auto-select the first card to prevent null submissions
        if (cardsResponse.data.length > 0) {
          setFormData(prev => ({ ...prev, card_id: cardsResponse.data[0].id }));
        }
      } catch (err) {
        console.error('[Dashboard Initialization Error]', err);
        // If the token is invalid or expired, the API throws an error, we kick them out
        if (err.message.includes('token') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('origin_vault_token');
          router.push('/login');
        } else {
          setError('Failed to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock, 10)
      };

      await fetchAPI('/inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Refresh inventory list after successful injection
      const updatedInventory = await fetchAPI('/inventory');
      setInventory(updatedInventory.data);
      
      // Reset numeric fields
      setFormData(prev => ({ ...prev, price: '', cost: '', stock: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
        <p className="tracking-widest uppercase animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <header className="mb-10 border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Command Center
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-widest text-sm">Inventory Management Node</p>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('origin_vault_token');
            router.push('/login');
          }}
          className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          Terminate Session
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Injection Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl h-fit">
          <h2 className="text-xl font-bold text-cyan-400 mb-6">Inject Stock</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Card Target</label>
              <select
                name="card_id"
                value={formData.card_id}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {cards.map(card => (
                  <option key={card.id} value={card.id}>{card.name} ({card.rarity})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Near Mint">Near Mint</option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="English">English</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cost ($)</label>
                <input
                  type="number"
                  name="cost"
                  step="0.01"
                  min="0"
                  required
                  value={formData.cost}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Units</label>
                <input
                  type="number"
                  name="stock"
                  min="1"
                  required
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Transaction...' : 'Commit to Vault'}
            </button>
          </form>
        </section>

        {/* Inventory Ledger */}
        <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl overflow-x-auto">
          <h2 className="text-xl font-bold text-emerald-400 mb-6">Active Ledger</h2>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3 font-semibold">Asset</th>
                <th className="pb-3 font-semibold">Variant</th>
                <th className="pb-3 font-semibold">Stock</th>
                <th className="pb-3 font-semibold">Market Price</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500 italic">
                    The ledger is currently empty.
                  </td>
                </tr>
              ) : (
                inventory.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 text-slate-200 font-medium">{item.card_name}</td>
                    <td className="py-4 text-slate-400 text-sm">
                      {item.condition} • {item.language}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-cyan-950 text-cyan-400 rounded text-xs font-bold">
                        {item.stock} Units
                      </span>
                    </td>
                    <td className="py-4 text-emerald-400 font-mono">${parseFloat(item.price).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}