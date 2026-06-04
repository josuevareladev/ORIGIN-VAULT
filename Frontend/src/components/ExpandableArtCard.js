"use client";

export default function ExpandableArtCard({ item, onAcquire }) {
  const isDepleted = item.stock === 0;

  return (
    <article className="group relative flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]">
      
      {/* Premium Visual Placeholder with Parallax Effect */}
      <div className="h-64 relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
        
        <span className="text-slate-700 font-extrabold uppercase tracking-[0.3em] text-4xl group-hover:scale-110 group-hover:text-slate-600 transition-all duration-700 ease-out z-0">
          {item.card_name.substring(0, 4)}
        </span>

        {/* Stock Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border backdrop-blur-md ${
            isDepleted 
              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isDepleted ? 'Vault Depleted' : `${item.stock} in Vault`}
          </span>
        </div>
      </div>
      
      {/* Expandable Content Section */}
      <div className="p-6 flex-1 flex flex-col relative bg-slate-900 z-20">
        <h3 className="text-xl font-bold text-slate-100 mb-1 line-clamp-1">{item.card_name}</h3>
        
        {/* Hidden Details that expand on hover */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
          <div className="overflow-hidden">
            <div className="flex gap-2 py-3">
              <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded">
                {item.condition}
              </span>
              <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider rounded">
                {item.language}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-800/50">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Market Value</p>
            <p className="text-2xl font-mono font-bold text-cyan-400">
              ${parseFloat(item.price).toFixed(2)}
            </p>
          </div>
          
          <button 
            onClick={() => onAcquire(item)}
            disabled={isDepleted}
            className="relative overflow-hidden px-6 py-2 bg-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 font-bold uppercase tracking-widest text-xs rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            <span className="relative z-10">{isDepleted ? 'Sealed' : 'Acquire'}</span>
            <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out"></div>
          </button>
        </div>
      </div>
    </article>
  );
}