'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mensensor email (Privacy)
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    return `${name.substring(0, 3)}***@${domain}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // 1. Ambil Data Profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, role, avatar_url, cover_url, bio')
          .eq('id', authUser.id)
          .single();

        // 2. Ambil Jumlah Komik Dibaca (History)
        const { count: readCount } = await supabase
          .from('reading_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        // 3. Ambil Jumlah Bookmark Tersimpan
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        setUser({
          email: authUser.email,
          name: profile?.username || authUser.email?.split('@')[0],
          role: profile?.role || 'user',
          avatar_url: profile?.avatar_url || '/ic-profile.jpg',
          cover_url: profile?.cover_url || '',
          bio: profile?.bio || 'Belum ada bio.',
          stats: { 
            read: readCount || 0, 
            bookmark: bookmarkCount || 0 
          }
        });
      } catch (err) {
        console.error("Gagal memuat profil", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-bold text-red-900">Memuat Profil...</main>;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans overflow-x-hidden relative selection:bg-red-900/50">
      
      {/* HEADER UTAMA */}
      <header className="relative z-10 px-4 py-5 flex justify-between items-center mb-2">
        <h1 className="text-sm font-extrabold tracking-widest text-white uppercase">Profile</h1>
        <Link href="/setting" className="w-9 h-9 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
        </Link>
      </header>

      <div className="relative z-10 px-4 max-w-xl mx-auto">
        
        {!user ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 text-center flex flex-col items-center gap-3 shadow-lg mb-6">
            <h2 className="text-xs font-bold text-gray-300">Belum Login</h2>
            <p className="text-[11px] text-gray-500 mb-2">Login untuk menyimpan riwayat dan bookmark</p>
            <Link href="/login" className="bg-red-900 text-white font-bold py-2.5 px-6 rounded-xl text-xs w-full shadow border border-red-800">
              Masuk / Daftar
            </Link>
          </div>
        ) : (
          <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shadow-xl mb-6 overflow-hidden">
            
            {/* COVER DI DALAM KOTAK PROFIL */}
            <div className="w-full h-28 bg-red-950/30 relative">
              {user.cover_url ? (
                <img src={user.cover_url} alt="Cover" className="w-full h-full object-cover opacity-70" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-red-900/20 to-black/50"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 to-transparent"></div>
            </div>

            {/* INFO AVATAR & PROFIL (Overlapping Cover) */}
            <div className="px-5 pb-5 flex flex-col gap-4 -mt-10 relative z-10">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl bg-black border-4 border-[#111] flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col overflow-hidden mb-1">
                  <h2 className="text-lg font-bold text-gray-100 truncate">{user.name}</h2>
                  {/* Email sudah disensor untuk keamanan */}
                  <p className="text-[10px] text-gray-400 truncate">{maskEmail(user.email)}</p>
                  {user.role === 'admin' && (
                    <span className="mt-1.5 bg-red-900 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max uppercase border border-red-800 shadow-sm">Admin</span>
                  )}
                </div>
              </div>
              
              <p className="text-[11px] text-gray-400 italic bg-black/40 p-3 rounded-xl border border-white/5 line-clamp-2">
                "{user.bio}"
              </p>

              <Link href="/profile/edit" className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-xs font-bold text-gray-300 transition-colors">
                Edit Profil
              </Link>
            </div>
          </div>
        )}

        {/* KOTAK STATISTIK (Dinamis dari Database) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
            <span className="text-2xl font-extrabold text-gray-200">{user?.stats?.read || 0}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 text-center">Komik Dibaca</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
            <span className="text-2xl font-extrabold text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">{user?.stats?.bookmark || 0}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 text-center">Tersimpan</span>
          </div>
        </div>

        {/* MENU AKTIVITAS */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider ml-2">Aktivitas</h3>
          
          <Link href="/library" className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5 hover:bg-white/5 transition-colors shadow-sm">
            <span className="text-xs font-bold text-gray-300">Riwayat Baca</span>
            <span className="text-gray-600 text-xs">▶</span>
          </Link>

          <Link href="/library?tab=bookmark" className="flex items-center justify-between p-4 rounded-xl bg-[#111] border border-white/5 hover:bg-white/5 transition-colors shadow-sm">
            <span className="text-xs font-bold text-gray-300">Bookmark Tersimpan</span>
            <span className="text-gray-600 text-xs">▶</span>
          </Link>

          {/* JEMBATAN MENU ADMIN (Hanya muncul jika role user adalah 'admin') */}
          {user?.role === 'admin' && (
            <>
              <h3 className="text-[10px] font-bold text-red-600 mb-1 mt-6 uppercase tracking-wider ml-2">Admin Control</h3>
              <Link href="/admin" className="flex items-center justify-between p-4 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 transition-colors shadow-[0_0_15px_rgba(127,29,29,0.1)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-red-400">Dashboard Kontrol Admin</span>
                </div>
                <span className="text-red-800 text-xs">▶</span>
              </Link>
            </>
          )}
        </div>
      </div>

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
