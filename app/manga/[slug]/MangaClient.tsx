'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function MangaClient({ slug, manga, chapters }: { slug: string, manga: any, chapters: any[] }) {
  const router = useRouter();
  
  // State Supabase
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastHistory, setLastHistory] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // State UI
  const [currentPage, setCurrentPage] = useState(1);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const chaptersPerPage = 25;

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;

          // 1. Cek Bookmark
          const { data: bmData } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .maybeSingle(); // Pakai maybeSingle supaya tidak error jika kosong
          
          if (bmData) setIsBookmarked(true);

          // 2. Cek Riwayat Baca (History)
          const { data: histData, error: histError } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .maybeSingle();

          if (!histError && histData) {
            setLastHistory(histData);
          }
        }
      } catch (err) {
        console.error("Gagal memuat status user:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserStatus();
  }, [slug]);

  // Handle Bookmark (Simpan/Hapus dari Database)
  const handleBookmarkToggle = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Silakan login terlebih dahulu untuk menyimpan bookmark!');
      router.push('/login');
      return;
    }

    const userId = session.user.id;

    if (isBookmarked) {
      // Hapus dari bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('manga_slug', slug);

      if (!error) setIsBookmarked(false);
    } else {
      // Tambah ke bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert([{
          user_id: userId,
          manga_slug: slug,
          manga_title: manga.title,
          cover_url: manga.thumbnail_url,
          type: manga.type
        }]);

      if (!error) setIsBookmarked(true);
      else alert('Gagal menyimpan bookmark. Coba lagi.');
    }
  };

  // Handle Share (Bagikan Komik)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga.title,
          text: `Baca ${manga.title} di StarDoom Comic!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share dibatalkan", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
    setIsMenuOpen(false);
  };

  // 1. URUTKAN CHAPTER (Terbaru di Atas / Descending)
  const sortedChapters = [...chapters].sort((a, b) => {
    const numA = parseFloat(a.name.match(/\d+(\.\d+)?/)?.[0] || "0");
    const numB = parseFloat(b.name.match(/\d+(\.\d+)?/)?.[0] || "0");
    return numB - numA; 
  });

  // 2. PAGINATION CHAPTER
  const totalPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const indexOfLastChapter = currentPage * chaptersPerPage;
  const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
  const currentChapters = sortedChapters.slice(indexOfFirstChapter, indexOfLastChapter);

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 3);
  if (endPage - startPage < 3) startPage = Math.max(1, endPage - 3);
  const paginationRange = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  // Ambil Chapter 1 untuk tombol "Mulai Baca" (Paling ujung bawah array yang dibalik)
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[sortedChapters.length - 1] : null; 

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-24 font-sans selection:bg-red-900/50">
      
      {/* HEADER NAVBAR */}
      <div className="flex justify-between items-center p-4 relative z-50">
        <button onClick={() => router.back()} className="w-10 h-10 bg-[#111] hover:bg-[#222] transition-colors rounded-full flex items-center justify-center border border-white/5 shadow-md">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        
        {/* Menu Titik Tiga Kanan Atas */}
        <div className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 bg-[#111] hover:bg-[#222] transition-colors rounded-full flex items-center justify-center border border-white/5 shadow-md">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>

          {/* Dropdown Menu Glassmorphism */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute top-12 right-0 w-44 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl z-50 animate-fade-in">
                <button onClick={handleShare} className="text-left px-4 py-3.5 text-xs font-bold text-gray-200 hover:bg-white/10 transition-colors border-b border-white/5">
                  Bagikan Komik
                </button>
                <button onClick={() => { alert('Fitur lapor bug segera hadir!'); setIsMenuOpen(false); }} className="text-left px-4 py-3.5 text-xs font-bold text-gray-200 hover:bg-white/10 transition-colors border-b border-white/5">
                  Laporkan Bug
                </button>
                <button onClick={() => window.location.reload()} className="text-left px-4 py-3.5 text-xs font-bold text-gray-200 hover:bg-white/10 transition-colors">
                  Refresh Halaman
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HERO / INFO KOMIK */}
      <div className="px-4 flex gap-4 mt-2">
        <div className="relative w-[120px] shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-xl bg-gray-900 border border-white/5">
          <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 bg-red-600 rounded-br-xl px-2 py-1 shadow-md">
            <span className="text-yellow-300 text-[10px]">⭐</span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1.5 flex-1 overflow-hidden">
          <h1 className="text-xl font-bold text-gray-100 leading-tight line-clamp-3">{manga.title}</h1>
          <p className="text-sm text-gray-400 truncate">{manga.author || 'Unknown'}</p>
          
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#a31a1a] text-white border border-red-800 shadow-sm">
              {manga.type || 'Manga'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#1a1a1a] text-gray-300 border border-white/10">
              {manga.status || 'Ongoing'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {manga.genre?.slice(0, 4).map((g: string, idx: number) => (
              <span key={idx} className="text-[9px] text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="px-4 flex flex-col gap-3 mt-6">
        
        {/* BARIS UTAMA (MULAI BACA + BOOKMARK) */}
        <div className="flex gap-3">
          <Link href={firstChapter ? `/baca/${slug}/${firstChapter.slug}` : '#'} className="flex-1 bg-[#a31a1a] hover:bg-red-800 transition-colors text-white font-bold rounded-xl flex items-center justify-center py-3.5 shadow-lg shadow-red-900/30">
            Mulai Baca
          </Link>

          <button onClick={handleBookmarkToggle} disabled={loadingUser} className="w-14 h-14 bg-[#111] border border-white/5 hover:bg-white/5 transition-colors rounded-xl flex items-center justify-center shrink-0 shadow-md">
            {loadingUser ? (
              <span className="text-gray-500 text-xs">...</span>
            ) : isBookmarked ? (
              <svg className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></svg>
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            )}
          </button>
        </div>

        {/* TOMBOL LANJUTKAN MEMBACA (Hanya Muncul Jika Ada History) */}
        {lastHistory && (
          <Link href={`/baca/${slug}/${lastHistory.last_chapter_slug}`} className="w-full bg-[#111] hover:bg-white/5 border border-white/10 transition-colors text-gray-300 hover:text-white font-bold rounded-xl flex items-center justify-center py-3 shadow-md">
            Lanjutkan Membaca Ch: {lastHistory.last_chapter_name.replace(/chapter/i, '').trim()}
          </Link>
        )}

      </div>

      {/* SINOPSIS */}
      <div className="px-4 mt-6">
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl shadow-sm">
          <h3 className="text-[13px] font-bold text-gray-100 mb-2">Sinopsis</h3>
          <p className={`text-[11px] text-gray-400 leading-relaxed whitespace-pre-line ${isSynopsisExpanded ? '' : 'line-clamp-3'}`}>
            {manga.description || "Tidak ada sinopsis yang tersedia."}
          </p>
          
          {manga.description && manga.description.length > 150 && (
            <button 
              onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} 
              className="text-[11px] font-bold text-[#e53e3e] mt-2 hover:text-red-400 transition-colors"
            >
              {isSynopsisExpanded ? 'Tutup' : 'Baca Selengkapnya'}
            </button>
          )}
        </div>
      </div>

      {/* DAFTAR CHAPTER */}
      <div className="px-4 mt-8 flex flex-col gap-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-red-600 rounded-full"></div>
            <h2 className="text-base font-bold text-white">Daftar Chapter</h2>
          </div>
          <span className="text-[10px] text-gray-500">{chapters.length} Total</span>
        </div>

        {currentChapters.map((ch: any) => {
          const isLastRead = lastHistory?.last_chapter_slug === ch.slug;
          return (
            <Link key={ch.slug} href={`/baca/${slug}/${ch.slug}`} className={`border p-4 rounded-xl flex justify-between items-center transition-colors ${isLastRead ? 'bg-red-950/20 border-red-900/50 hover:bg-red-900/30' : 'bg-[#111] hover:bg-[#1a1a1a] border-white/5'}`}>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isLastRead ? 'text-red-400' : 'text-gray-200'}`}>{ch.name}</span>
                {isLastRead && <span className="text-[9px] text-red-500 font-bold mt-1">🔖 Terakhir dibaca</span>}
              </div>
              <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
            </Link>
          )
        })}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs font-bold hover:bg-white/5 transition-all text-gray-400 disabled:opacity-30"
            >
              {"<"}
            </button>
            
            {paginationRange.map(pageNum => (
              <button 
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:bg-white/5'}`}
              >
                {pageNum}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs font-bold hover:bg-white/5 transition-all text-gray-400 disabled:opacity-30"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

    </main>
  );
        }
          
