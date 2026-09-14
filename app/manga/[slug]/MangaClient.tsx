'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function MangaClient({ 
  komik, 
  chapterPertama, 
  currentChapters, 
  currentPage, 
  totalPages, 
  paginationArray 
}: any) {
  const router = useRouter();
  const [showFullSinopsis, setShowFullSinopsis] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Efek klik di luar untuk menutup dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TRIGGER UNTUK TOMBOL BAGIKAN
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Baca ${komik.title}`,
          text: `Cek komik ${komik.title} di StarDoom Comic!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share dibatalkan', error);
      }
    } else {
      // Fallback jika browser tidak support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link komik berhasil disalin ke clipboard!');
    }
    setMenuOpen(false);
  };

  // TRIGGER UNTUK TOMBOL LAPOR
  const handleReport = () => {
    // Nanti bisa diarahkan ke halaman form atau API laporan
    alert('Terima kasih! Fitur laporan sedang dihubungkan ke database server.');
    setMenuOpen(false);
  };

  // Data dummy melanjutkan baca
  const lastReadChapterSlug = komik.chapters[15]?.slug || null; 
  const lastReadChapterName = komik.chapters[15]?.name || "Chapter ??";

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-red-900/50 relative overflow-x-hidden">
      
      {/* Background Blur Image */}
      <div className="absolute top-0 w-full h-[50vh] overflow-hidden opacity-20 z-0">
        <img src={komik.thumbnail_url} alt="bg" className="w-full h-full object-cover blur-3xl scale-110 grayscale-[30%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/90 to-[#050505]"></div>
      </div>

      {/* HEADER NAVIGASI */}
      <header className="sticky top-0 z-50 px-4 py-4 flex justify-between items-center bg-[#050505]/40 backdrop-blur-lg border-b border-white/5 shadow-sm">
        <button onClick={() => router.back()} className="w-10 h-10 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/10 transition-colors">
          ←
        </button>
        
        {/* FITUR TITIK TIGA - Desain Glassmorphism Clean */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 bg-[#111]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/10 transition-colors">
            ⋮
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-[#0a0a0a]/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
              <button onClick={handleShare} className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5">
                Bagikan Komik
              </button>
              <button onClick={handleReport} className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-red-900/40 hover:text-red-400 transition-colors border-b border-white/5">
                Laporkan Error
              </button>
              <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <div className="relative z-10 px-4 max-w-xl mx-auto mt-2">
        
        {/* INFO KOMIK */}
        <div className="flex gap-4 items-start mb-6">
          <div className="w-32 sm:w-40 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative bg-[#111]">
            <img src={komik.thumbnail_url} alt={komik.title} className="w-full h-auto aspect-[2/3] object-cover grayscale-[10%]" />
            <div className="absolute top-0 left-0 bg-red-900 border-b border-r border-red-800 text-[10px] font-bold px-2 py-1 rounded-br-lg shadow-md text-white">
              ⭐ {komik.rating || '-'}
            </div>
          </div>
          <div className="flex flex-col pb-1 w-full">
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-gray-100 mb-1">{komik.title}</h1>
            <p className="text-[11px] text-gray-500 font-medium mb-3">{komik.author || 'Author Tidak Diketahui'}</p>
            
            {/* TAG TIPE & STATUS (Warna Menonjol Sedikit) */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[9px] px-2 py-0.5 bg-red-900/30 border border-red-900/50 rounded text-red-300 font-bold tracking-wide uppercase">{komik.type || 'Manga'}</span>
              <span className="text-[9px] px-2 py-0.5 bg-white/10 border border-white/10 rounded text-gray-300 font-bold tracking-wide uppercase">{komik.status || 'Ongoing'}</span>
            </div>

            {/* GENRE KOTAK KECIL */}
            {komik.genres && komik.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {komik.genres.map((genre: any, idx: number) => {
                  const genreName = typeof genre === 'string' ? genre : (genre.name || genre);
                  return (
                    <span key={idx} className="text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400">
                      {genreName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GRUP TOMBOL BACA & BOOKMARK */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex gap-3">
            {chapterPertama ? (
              <Link href={`/baca/${komik.slug}/${chapterPertama}`} className="flex-1 bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl text-center shadow-[0_0_15px_rgba(127,29,29,0.5)] border border-red-800 transition-all text-sm tracking-wide">
                Mulai Baca
              </Link>
            ) : (
              <div className="flex-1 bg-[#111] text-gray-600 font-bold py-3.5 rounded-xl text-center border border-white/5 text-sm">Chapter Kosong</div>
            )}

            <button className="w-14 shrink-0 bg-[#111] hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all group">
              <img src="/ic-bookmark.jpg" alt="Bookmark" className="w-6 h-6 mix-blend-screen opacity-60 group-hover:opacity-100" />
            </button>
          </div>

          {lastReadChapterSlug && (
            <Link href={`/baca/${komik.slug}/${lastReadChapterSlug}`} className="w-full bg-[#111] hover:bg-white/5 text-gray-300 font-bold py-2.5 rounded-xl text-center text-[11px] border border-white/5 transition-all shadow-sm">
              Lanjutkan Baca ({lastReadChapterName})
            </Link>
          )}
        </div>

        {/* SINOPSIS */}
        <div className="mb-8 bg-[#111] p-4 rounded-xl border border-white/5 shadow-sm">
          <h3 className="text-sm font-bold mb-2 text-gray-300">Sinopsis</h3>
          <p className={`text-xs text-gray-400 leading-relaxed text-justify ${!showFullSinopsis ? 'line-clamp-4' : ''}`}>
            {komik.description || 'Sinopsis belum tersedia untuk komik ini.'}
          </p>
          {komik.description && komik.description.length > 150 && (
            <button onClick={() => setShowFullSinopsis(!showFullSinopsis)} className="text-red-700 text-[10px] mt-2 font-bold hover:text-red-500 transition-colors uppercase tracking-wider">
              {showFullSinopsis ? 'Tampilkan Lebih Sedikit' : 'Baca Selengkapnya'}
            </button>
          )}
        </div>

        {/* DAFTAR CHAPTER */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold border-l-4 border-red-900 pl-2 text-gray-200">Daftar Chapter</h3>
            <span className="text-[10px] text-gray-500 font-bold bg-[#111] px-2 py-1 rounded border border-white/5">{komik.chapters.length} Total</span>
          </div>
          
          <div className="flex flex-col gap-2">
            {currentChapters.map((ch: any) => (
              <Link key={ch.slug} href={`/baca/${komik.slug}/${ch.slug}`} className="flex justify-between items-center p-3 rounded-lg bg-[#111] border border-white/5 hover:border-red-900/50 hover:bg-white/5 transition-all group">
                <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200">{ch.name}</span>
                <span className="text-[10px] text-gray-600 group-hover:text-red-800">▶</span>
              </Link>
            ))}
          </div>

          {/* KONTROL PAGINASI */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link href={`?page=${currentPage - 1}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111] border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">{"<"}</Link>
              )}
              
              {paginationArray.map((pageNum: number) => (
                <Link key={pageNum} href={`?page=${pageNum}`} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.5)] border border-red-800' : 'bg-[#111] border border-white/10 text-gray-500 hover:bg-white/5'}`}>
                  {pageNum}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link href={`?page=${currentPage + 1}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111] border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors">{">"}</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
          }
          
