"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../../../utils/supabase';

export default function ReaderUI({ 
  komik, chapter, chapterData, mangaData, prevCh, nextCh, judulKomik, namaChapter 
}: any) {
  const [navVisible, setNavVisible] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // State Komentar & Fitur Spoiler/Gambar
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<any[]>([
    {
      id: 1,
      user: 'PembacaSetia',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reader2',
      time: '5 mnt lalu',
      text: 'Wah seru bgt, btw... [spoiler]itu nanti mati[/spoiler] beneran gak nyangka plot twistnya gini!',
      image: null
    }
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 0. Rekam Otomatis Riwayat Baca (Sistem Siluman)
  useEffect(() => {
    let isMounted = true;

    const saveReadingHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return; 

        const userId = session.user.id;
        const payloadData = {
          user_id: userId,
          manga_slug: komik,
          manga_title: judulKomik || komik,
          cover_url: mangaData?.thumbnail_url || '',
          last_chapter_slug: chapter,
          last_chapter_name: namaChapter || chapter,
          updated_at: new Date()
        };

        await supabase.from('reading_history').upsert(payloadData, { onConflict: 'user_id, manga_slug' });
      } catch (err) {
        console.error("System Crash:", err);
      }
    };

    if (komik && chapter) {
      const timer = setTimeout(() => {
        if (isMounted) saveReadingHistory();
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => { isMounted = false; };
  }, [komik, chapter, judulKomik, namaChapter, mangaData]);
  
  // 1. Logika Hide Nav on Scroll & Deteksi Bawah
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolledToBottom = window.innerHeight + currentScrollY >= document.body.offsetHeight - 150;
      setIsAtBottom(scrolledToBottom);

      if (currentScrollY > lastScrollY && currentScrollY > 100 && !scrolledToBottom) {
        setNavVisible(false);
        setShowSettings(false);
      } else if (currentScrollY < lastScrollY) {
        setNavVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Logika Auto Scroll (Bisa Berhenti Manual saat User Scroll/Sentuh Layar)
  useEffect(() => {
    let animationId: number;
    const scroll = () => {
      if (isAutoScrolling && !isAtBottom) {
        window.scrollBy(0, scrollSpeed);
        animationId = requestAnimationFrame(scroll);
      } else if (isAtBottom && isAutoScrolling) {
        setIsAutoScrolling(false);
        setNavVisible(true);
      }
    };

    if (isAutoScrolling) {
      animationId = requestAnimationFrame(scroll);
      setNavVisible(false);
    }

    // Listener untuk mendeteksi interaksi manual user agar Auto-Scroll berhenti
    const stopAutoScroll = () => {
      if (isAutoScrolling) {
        setIsAutoScrolling(false);
      }
    };

    window.addEventListener('wheel', stopAutoScroll, { passive: true });
    window.addEventListener('touchstart', stopAutoScroll, { passive: true });
    window.addEventListener('mousedown', stopAutoScroll, { passive: true });
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('wheel', stopAutoScroll);
      window.removeEventListener('touchstart', stopAutoScroll);
      window.removeEventListener('mousedown', stopAutoScroll);
    };
  }, [isAutoScrolling, scrollSpeed, isAtBottom]);

  // Fungsi Pintasan Jump to Top / Bottom
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Fungsi Tombol Spoiler & Gambar di Komentar
  const addSpoilerTag = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = commentText;
    const highlighted = text.substring(start, end) || 'teks spoiler';
    const newText = text.substring(0, start) + `[spoiler]${highlighted}[/spoiler]` + text.substring(end);
    setCommentText(newText);
  };

  const addImageComment = () => {
    const imgUrl = prompt("Masukkan URL Gambar:");
    if (imgUrl) {
      setCommentText(prev => prev + `\n[img]${imgUrl}[/img]`);
    }
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    const newCmt = {
      id: Date.now(),
      user: 'Kamu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser',
      time: 'Baru saja',
      text: commentText,
      image: null
    };
    setCommentsList([newCmt, ...commentsList]);
    setCommentText('');
  };

  // Helper parsing teks spoiler [spoiler]...[/spoiler]
  const renderFormattedComment = (text: string) => {
    // Sederhana: ubah [spoiler] jadi elemen blur rahasia
    const parts = text.split(/(\[spoiler\].*?\[\/spoiler\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[spoiler]') && part.endsWith('[/spoiler]')) {
        const actualText = part.replace('[spoiler]', '').replace('[/spoiler]', '');
        return (
          <span key={i} className="bg-white/10 text-transparent hover:text-white px-1.5 rounded blur-[4px] hover:blur-none transition-all duration-300 cursor-pointer border border-white/5 select-none hover:select-auto mx-1">
            {actualText}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-red-900/50 pb-10 font-sans relative">
      
      {/* HEADER MELAYANG (TRANSPARAN) */}
      <header className={`fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-50 flex justify-between gap-2 transition-transform duration-500 ease-in-out ${navVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}>
        <Link href={`/manga/${komik}`} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all shrink-0">
          <img src="/ic-arrow-left.jpg" alt="Back" className="w-5 h-5 mix-blend-screen opacity-80" />
        </Link>
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 flex items-center justify-center shadow-lg overflow-hidden">
          <div className="flex gap-2 text-[10px] sm:text-xs font-bold items-center truncate">
            <span className="text-gray-200 truncate">{judulKomik}</span>
            <span className="text-gray-500">›</span>
            <span className="text-red-400 whitespace-nowrap">{namaChapter}</span>
          </div>
        </div>
        <Link href="/" className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all shrink-0">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mix-blend-screen opacity-80" />
        </Link>
      </header>

      {/* TOMBOL PINTASAN JUMP (UP & DOWN) DI KANAN */}
      <div className={`fixed right-4 bottom-24 z-40 flex flex-col gap-2 transition-opacity duration-300 ${navVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={scrollToTop} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/20 shadow-lg transition-all" title="Ke Atas">
          ▲
        </button>
        <button onClick={scrollToBottom} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/20 shadow-lg transition-all" title="Ke Bawah">
          ▼
        </button>
      </div>

      {/* AREA GAMBAR (KLIK UNTUK FULLSCREEN) */}
      <div 
        className="max-w-2xl mx-auto flex flex-col items-center pt-24 min-h-screen cursor-pointer"
        onClick={() => { setNavVisible(!navVisible); setShowSettings(false); }}
      >
        {chapterData.pages.map((pageUrl: string, index: number) => (
          <img key={index} src={pageUrl} alt={`Halaman ${index + 1}`} className="w-full h-auto object-contain block m-0 p-0" loading="lazy" />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* TOMBOL NEXT/PREV STATIS DI BAWAH (Hanya muncul jika mentok bawah) */}
        {isAtBottom && (
          <div className="flex justify-between items-center gap-4 py-6 border-b border-white/5 animate-fade-in">
            {prevCh ? (
              <Link href={`/baca/${komik}/${prevCh}`} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all">
                <img src="/ic-chevron-left.jpg" alt="Prev" className="w-4 h-4 mix-blend-screen opacity-70" />
                <span className="text-sm font-bold text-gray-300">Prev Chapter</span>
              </Link>
            ) : <div className="flex-1"></div>}

            {nextCh ? (
              <Link href={`/baca/${komik}/${nextCh}`} className="flex-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-[0_0_20px_rgba(153,27,27,0.3)]">
                <span className="text-sm font-bold text-white">Next Chapter</span>
                <img src="/ic-chevron-right.jpg" alt="Next" className="w-4 h-4 mix-blend-screen opacity-90" />
              </Link>
            ) : (
               <div className="flex-1 bg-white/5 py-3.5 rounded-xl text-center text-sm font-bold text-gray-600">Mentok Raw</div>
            )}
          </div>
        )}

        {/* KOLOM KOMENTAR & SPOILER & GAMBAR */}
        <div className="mt-8 pb-36">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
            💬 Diskusi Chapter
          </h3>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-8 focus-within:border-red-500/50 focus-within:bg-white/10 transition-all shadow-inner">
            <textarea 
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Tulis teorimu di sini..." 
              className="w-full bg-transparent text-sm text-white focus:outline-none resize-none min-h-[70px] placeholder:text-gray-600"
            ></textarea>
            
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
              <div className="flex gap-2">
                <button onClick={addImageComment} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 hover:border-gray-400 flex items-center justify-center text-sm transition-all text-gray-400" title="Kirim Gambar">📷</button>
                <button onClick={addSpoilerTag} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 hover:border-red-500/50 hover:text-red-400 flex items-center justify-center text-sm transition-all text-gray-400" title="Sensor Spoiler">👁️‍🗨️</button>
              </div>
              <button onClick={handlePostComment} className="px-5 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">Kirim</button>
            </div>
          </div>
          
          {/* DAFTAR KOMENTAR */}
          <div className="flex flex-col gap-6">
            {commentsList.map((cmt) => (
              <div key={cmt.id} className="flex gap-3">
                 <div className="w-9 h-9 rounded-full bg-white/10 shrink-0 overflow-hidden"><img src={cmt.avatar} alt="Avatar"/></div>
                 <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex gap-2 items-baseline">
                       <span className="text-sm font-bold text-gray-200">{cmt.user}</span>
                       <span className="text-[10px] text-gray-500">{cmt.time}</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed break-words">
                      {renderFormattedComment(cmt.text)}
                    </p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION (MELAYANG & ANTI-GETAR / STABLE LAYOUT) */}
      <div className={`fixed bottom-6 w-full px-4 max-w-2xl left-1/2 -translate-x-1/2 z-50 flex justify-between items-end gap-3 transition-transform duration-500 ease-in-out ${navVisible ? 'translate-y-0' : 'translate-y-[200%]'}`}>
        
        {/* TOMBOL KIRI (PREV): Menggunakan visibility:hidden agar lebar kontainer stabil & tidak getar */}
        <div className={`transition-opacity duration-300 ${isAtBottom ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`} aria-hidden={isAtBottom}>
          {prevCh ? (
            <Link href={`/baca/${komik}/${prevCh}`} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 shadow-lg">
              <img src="/ic-chevron-left.jpg" alt="Prev" className="w-5 h-5 mix-blend-screen opacity-80" />
            </Link>
          ) : <div className="w-12 h-12"></div>}
        </div>

        {/* PILL TENGAH (Menu & Auto Scroll) */}
        <div className="flex-1 relative flex justify-center">
          <div className={`absolute bottom-full mb-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl transition-all duration-300 origin-bottom ${showSettings ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
            <p className="text-[10px] font-bold text-gray-400 mb-2 text-center uppercase tracking-widest">Speed Scroll: {scrollSpeed}x</p>
            <input 
              type="range" min="1" max="10" value={scrollSpeed} 
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="w-32 accent-red-600 cursor-pointer"
            />
          </div>

          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-full px-5 py-2.5 flex gap-4 sm:gap-5 items-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <button onClick={() => setShowSettings(!showSettings)} className="hover:opacity-100 opacity-70 transition-opacity" title="Pengaturan Scroll">
              <img src="/ic-setting.jpg" alt="Setting" className="w-5 h-5 mix-blend-screen" />
            </button>
            
            <button onClick={() => { setIsAutoScrolling(!isAutoScrolling); setShowSettings(false); }} className="hover:opacity-100 opacity-70 transition-opacity" title="Auto Scroll">
              <img src="/ic-play.jpg" alt="Play" className={`w-5 h-5 mix-blend-screen transition-all ${isAutoScrolling ? 'filter sepia hue-rotate-[320deg] saturate-[500%]' : ''}`} />
            </button>

            <button className="hover:opacity-100 opacity-70 transition-opacity" title="Bookmark">
              <img src="/ic-bookmark.jpg" alt="Bookmark" className="w-5 h-5 mix-blend-screen" />
            </button>
            
            <div className="w-[1px] h-5 bg-white/20"></div>
            
            <Link href={`/manga/${komik}`} className="hover:opacity-100 opacity-70 transition-opacity" title="Detail Komik">
              <img src="/ic-menu.jpg" alt="Menu" className="w-5 h-5 mix-blend-screen" />
            </Link>
          </div>
        </div>

        {/* TOMBOL KANAN (NEXT): Menggunakan visibility:hidden agar stabil */}
        <div className={`transition-opacity duration-300 ${isAtBottom ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`} aria-hidden={isAtBottom}>
          {nextCh ? (
            <Link href={`/baca/${komik}/${nextCh}`} className="w-12 h-12 bg-red-900/60 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-800/80 shadow-[0_0_15px_rgba(153,27,27,0.3)]">
              <img src="/ic-chevron-right.jpg" alt="Next" className="w-5 h-5 mix-blend-screen opacity-90" />
            </Link>
          ) : <div className="w-12 h-12"></div>}
        </div>

      </div>
    </div>
  );
}
