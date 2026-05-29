export default async function Home() {
  let games = [];
  
  try {
    // Calling the internal Node.js API directly from the Next.js Server
    const res = await fetch('http://localhost:4000/api/games', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      games = json.data;
    }
  } catch (error) {
    console.error('[Client Error] Failed to fetch universes:', error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Origin Vault
        </h1>
        <p className="text-slate-400 text-lg tracking-widest uppercase">
          Core Trading Systems Initialized
        </p>
      </div>

      <div className="w-full max-w-4xl border border-slate-800 rounded-xl p-8 bg-slate-900/50 shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-semibold text-slate-200">
            Active Universes
          </h2>
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        
        {games.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Database connection established, awaiting initialization...
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game) => (
              <li 
                key={game.id} 
                className="group relative p-6 border border-slate-700 rounded-lg bg-slate-800 text-center font-bold tracking-wide transition-all hover:border-emerald-500 hover:bg-slate-800/80 cursor-pointer"
              >
                <span className="text-slate-300 group-hover:text-emerald-400 transition-colors">
                  {game.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}