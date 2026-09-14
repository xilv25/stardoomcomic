'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'bookmark' ? 'bookmark' : 'history';

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [bookmarkList, setBookmarkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchLibraryData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
      const userId = session.user.id;

      // Ambil Riwayat Baca
      const { data: hist } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (hist) setHistoryList(hist);

      // Ambil Bookmark
      const { data: bm } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (bm) setBookmarkList(bm);

      setLoading(false);
    };

    fetchLibraryData();
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-bold text-red-900">Memuat Library...</main>;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50">
      
      <header className="sticky top-0 z-50 px-4 py-4 flex justify-between items-center bg-[#050505]/90 backdrop-blur border-b border-white/5">
        <h1 className="text-sm font-extrabold tracking-widest text-white uppercase">Library</h1>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-4">
        
        {!isLoggedIn ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 text-center flex flex-col items-center gap-3 mt-10 shadow-lg">
            <h2 className="text-xs font-bold text-gray-300">Belum Login</h2>
            <p className="text-[11px] text-gray-500 mb-2">Login untuk melihat riwayat baca dan bookmark komikmu</p>
            <Link href="/login" className="bg-red-900 text-white font-bold py-2.5 px-6 rounded-xl text-xs w-full shadow border border-red-800">
              Masuk / Daftar
            </Link>
          </div>
        ) : (
          <>
            {/* TAB SWITCHER */}
            <div className="flex bg-[#111] rounded-2xl p-1 border border-white/5 mb-6">
              <Link href="/library" className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-red-900 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                Riwayat Baca
              </Link>
              <Link href="/library?tab=bookmark" className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all ${activeTab === 'bookmark' ? 'bg-red-900 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
                Bookmark ({bookmarkList.length})
              </Link>
            </div>

            {/* KONTEN TAB: RIWAYAT BACA */}
            {activeTab === 'history' && (
              <div className="flex flex-col gap-3">
                {historyList.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 mt-10">Belum ada riwayat baca.</p>
                ) : (
                  historyList.map((item) => (
                    <div key={item.id} className="bg-[#111] border border-white/5 rounded-2xl p-3 flex gap-3 items-center justify-between shadow-md">
                      <Link href={`/manga/${item.manga_slug}`} className="flex gap-3 items-center flex-1 overflow-hidden">
                        <img src={item.cover_url} alt={item.manga_title} className="w-12 h-16 object-cover rounded-xl shrink-0 bg-black" />
                        <div className="flex flex-col overflow-hidden">
                          <h4 className="text-xs font-bold text-gray-200 truncate">{item.manga_title}</h4>
                          <span className="text-[10px] text-red-500 font-medium mt-1">Terakhir: {item.last_chapter_name}</span>
                        </div>
                      </Link>
                      <Link href={`/baca/${item.manga_slug}/${item.last_chapter_slug}`} className="bg-red-900/40 border border-red-800 text-red-400 text-xs font-bold px-3 py-2 rounded-xl shrink-0">
                        Lanjut ▶
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* KONTEN TAB: BOOKMARK */}
            {activeTab === 'bookmark' && (
              <div className="grid grid-cols-2 gap-3">
                {bookmarkList.length === 0 ? (
                  <p className="col-span-2 text-center text-xs text-gray-500 mt-10">Belum ada komik tersimpan di bookmark.</p>
                ) : (
                  bookmarkList.map((item) => (
                    <Link key={item.id} href={`/manga/${item.manga_slug}`} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex flex-col group shadow-md">
                      <div className="aspect-[2/3] w-full overflow-hidden relative bg-black">
                        <img src={item.cover_url} alt={item.manga_title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      </div>
                      <div className="p-3 flex flex-col">
                        <span className="text-[9px] text-red-500 font-bold uppercase">{item.type || 'Manga'}</span>
                        <h4 className="text-xs font-bold text-gray-200 line-clamp-1 mt-0.5">{item.manga_title}</h4>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* NAVBAR BAWAH */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.9)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-red-800 pb-2">
          <svg className="w-5 h-5 mb-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span className="text-[10px] font-bold">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
            }
