'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        if (!userId) return;

        // 1. Ambil Data Profil Target
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, role, avatar_url, cover_url, bio')
          .eq('id', userId)
          .single();

        if (error || !profile) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // 2. Ambil Jumlah Komik Dibaca User Tersebut
        const { count: readCount } = await supabase
          .from('reading_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // 3. Ambil Jumlah Bookmark Tersimpan User Tersebut
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        setUser({
          name: profile.username || 'Reader',
          role: profile.role || 'user',
          avatar_url: profile.avatar_url || '/ic-profile.jpg',
          cover_url: profile.cover_url || '',
          bio: profile.bio || 'Belum ada bio.',
          stats: { 
            read: readCount || 0, 
            bookmark: bookmarkCount || 0 
          }
        });
      } catch (err) {
        console.error("Gagal memuat profil publik", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-bold text-red-900">Memuat Profil...</main>;
  }

  if (notFound || !user) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black text-red-600 mb-2">404</h1>
        <p className="text-gray-400 mb-6 text-sm">Profil pengguna tidak ditemukan.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold transition-all">Kembali</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans overflow-x-hidden relative selection:bg-red-900/50">
      
      {/* HEADER UTAMA */}
      <header className="relative z-10 px-4 py-5 flex justify-between items-center mb-2">
        <button onClick={() => router.back()} className="w-9 h-9 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg">
          <svg className="w-5 h-5 text-gray-300 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-xs font-extrabold tracking-widest text-gray-400 uppercase">Public Profile</h1>
        <div className="w-9"></div> {/* Placeholder untuk balance header */}
      </header>

      <div className="relative z-10 px-4 max-w-xl mx-auto">
        
        {/* KARTU PROFIL PUBLIK */}
        <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-xl mb-6 overflow-hidden animate-fade-in">
          
          {/* COVER BANNER */}
          <div className="w-full h-28 bg-red-950/30 relative">
            {user.cover_url ? (
              <img src={user.cover_url} alt="Cover" className="w-full h-full object-cover opacity-70" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-red-900/20 to-black/50"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 to-transparent"></div>
          </div>

          {/* INFO AVATAR & PROFIL */}
          <div className="px-5 pb-6 flex flex-col gap-4 -mt-10 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-black border-4 border-[#111] flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col overflow-hidden mb-1">
                <h2 className="text-lg font-bold text-gray-100 truncate">{user.name}</h2>
                {/* Privasi: Tidak ada email yang di-render di sini! */}
                
                {user.role === 'admin' && (
                  <span className="mt-1.5 bg-red-900 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max uppercase border border-red-800 shadow-sm">Admin</span>
                )}
                {user.role === 'uploader' && (
                  <span className="mt-1.5 bg-blue-900 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max uppercase border border-blue-800 shadow-sm">Uploader</span>
                )}
              </div>
            </div>
            
            <p className="text-[11px] text-gray-300 italic bg-black/40 p-4 rounded-xl border border-white/5 leading-relaxed">
              "{user.bio}"
            </p>
          </div>
        </div>

        {/* KOTAK STATISTIK PUBLIK */}
        <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
            <span className="text-2xl font-extrabold text-gray-200">{user?.stats?.read || 0}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 text-center">Komik Dibaca</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
            <span className="text-2xl font-extrabold text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">{user?.stats?.bookmark || 0}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 text-center">Tersimpan</span>
          </div>
        </div>

      </div>

      {/* BOTTOM NAVIGATION BAWAAN */}
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
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
                   }
