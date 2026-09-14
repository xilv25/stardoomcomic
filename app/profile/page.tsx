import Link from 'next/link';

export default function ProfilePage() {
  // DUMMY DATA (Nanti diganti data dari Database)
  const user = {
    name: "Tamu (Guest)",
    email: "Belum login",
    role: "admin", // Coba ganti ke 'user' nanti
    stats: { read: 12, bookmark: 5 }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans overflow-x-hidden relative selection:bg-red-900/50">
      
      {/* HEADER TINGGI UNTUK BACKGROUND PROFILE */}
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-red-900/40 to-[#050505] z-0"></div>

      <header className="relative z-10 px-4 py-5 flex justify-between items-center">
        <h1 className="text-lg font-extrabold tracking-widest text-white drop-shadow-md">Profile</h1>
        <Link href="/setting" className="w-10 h-10 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </Link>
      </header>

      <div className="relative z-10 px-4 max-w-xl mx-auto mt-4">
        
        {/* KARTU PROFIL USER */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-5 flex items-center gap-4 shadow-lg mb-6">
          <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/ic-profile.jpg" alt="Avatar" className="w-full h-full object-cover mix-blend-screen opacity-80" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-100">{user.name}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.role === 'admin' && (
              <span className="mt-1 bg-red-900 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max uppercase border border-red-800 shadow-sm">Admin</span>
            )}
          </div>
        </div>

        {/* STATISTIK */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-200">{user.stats.read}</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Komik Dibaca</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-red-700">{user.stats.bookmark}</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Tersimpan</span>
          </div>
        </div>

        {/* MENU LIST */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-2">Aktivitas</h3>
          
          <Link href="/library" className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">🕒</div>
              <span className="text-sm font-bold text-gray-300">Riwayat Baca</span>
            </div>
            <span className="text-gray-600 text-xs">▶</span>
          </Link>

          <Link href="/library?tab=bookmark" className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-900/20 border border-red-900/30 flex items-center justify-center text-red-500">🔖</div>
              <span className="text-sm font-bold text-gray-300">Bookmark</span>
            </div>
            <span className="text-gray-600 text-xs">▶</span>
          </Link>

          {/* MENU KHUSUS ADMIN */}
          {user.role === 'admin' && (
            <>
              <h3 className="text-xs font-bold text-red-800 mb-2 mt-6 uppercase tracking-wider ml-2">Admin Area</h3>
              <Link href="/admin" className="flex items-center justify-between p-4 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-red-800 flex items-center justify-center text-red-400">🛡️</div>
                  <span className="text-sm font-bold text-red-400">Dashboard Admin</span>
                </div>
                <span className="text-red-800 text-xs">▶</span>
              </Link>
            </>
          )}

          <h3 className="text-xs font-bold text-gray-500 mb-2 mt-6 uppercase tracking-wider ml-2">Bantuan</h3>
          
          <button className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5 hover:bg-white/5 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">💬</div>
              <span className="text-sm font-bold text-gray-300">Hubungi Kami</span>
            </div>
          </button>
        </div>

      </div>

      {/* BOTTOM NAV (Copas dari page.tsx sebelumnya biar konsisten) */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.9)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <svg className="w-5 h-5 mb-1 opacity-50 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-red-800 pb-2 transition-colors">
          <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mb-1 mix-blend-screen" style={{ filter: 'drop-shadow(0 0 5px rgba(127,29,29,0.5)) sepia(1) hue-rotate(320deg) saturate(500%) brightness(0.7)' }} />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>

    </main>
  );
            }
