'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase'; // Sesuaikan path utils-mu
import Link from 'next/link';

export default function MangaDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [manga, setManga] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastHistory, setLastHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const MAKOTA_TOKEN = process.env.NEXT_PUBLIC_MAKOTA_API_TOKEN || ""; // Atau ambil dari backend/env

  useEffect(() => {
    if (!slug) return;

    const fetchDetailAndUserStatus = async () => {
      try {
        // 1. Ambil Detail Komik dari Makota API
        const res = await fetch(`https://api.makota.asia/api/v1/manga/${slug}`);
        const data = await res.json();
        if (data.ok && data.data?.manga) {
          setManga(data.data.manga);
          setChapters(data.data.manga.chapters || []);
        }

        // 2. Cek User & Status Bookmark / History
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;

          // Cek Bookmark
          const { data: bmData } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .single();
          if (bmData) setIsBookmarked(true);

          // Cek Riwayat Baca
          const { data: histData } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .single();
          if (histData) setLastHistory(histData);
        }
      } catch (err) {
        console.error("Gagal memuat detail", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailAndUserStatus();
  }, [slug]);

  // Fungsi Toggle Bookmark
  const handleBookmarkToggle = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Silakan login terlebih dahulu untuk menyimpan bookmark!');
      router.push('/login');
      return;
    }

    const userId = session.user.id;

    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('manga_slug', slug);
      setIsBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert([{
        user_id: userId,
        manga_slug: slug,
        manga_title: manga.title,
        cover_url: manga.thumbnail_url,
        type: manga.type
      }]);
      setIsBookmarked(true);
    }
  };

  if (loading) return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Memuat...</main>;
  if (!manga) return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Komik tidak ditemukan.</main>;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50">
      
      {/* HEADER & COVER */}
      <div className="relative w-full h-[35vh]">
        <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover opacity-30 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
        
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-9 h-9 bg-black/60 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-sm z-10">
          ←
        </button>
      </div>

      <div className="px-4 max-w-xl mx-auto -mt-20 relative z-10 flex flex-col gap-6">
        
        <div className="flex gap-4 items-end">
          <div className="w-28 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 bg-[#111]">
            <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <span className="bg-red-900/80 border border-red-800 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max">{manga.type || 'Manga'}</span>
            <h1 className="text-lg font-extrabold text-white leading-snug">{manga.title}</h1>
            
            {/* TOMBOL BOOKMARK */}
            <button onClick={handleBookmarkToggle} className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${isBookmarked ? 'bg-red-900 border-red-800 text-white shadow-[0_0_10px_rgba(127,29,29,0.5)]' : 'bg-[#111] border-white/10 text-gray-300 hover:bg-white/5'}`}>
              {isBookmarked ? '🔖 Tersimpan di Bookmark' : '+ Simpan Bookmark'}
            </button>
          </div>
        </div>

        {/* TOMBOL LANJUTKAN MEMBACA */}
        {lastHistory ? (
          <Link href={`/baca/${slug}/${lastHistory.last_chapter_slug}`} className="bg-red-950/40 border border-red-900/50 p-4 rounded-2xl flex justify-between items-center hover:bg-red-900/30 transition-all shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Lanjutkan Membaca</span>
              <span className="text-sm font-extrabold text-gray-200 mt-0.5">{lastHistory.last_chapter_name}</span>
            </div>
            <span className="bg-red-900 text-white px-4 py-2 rounded-xl text-xs font-bold border border-red-800">Lanjut ▶</span>
          </Link>
        ) : chapters.length > 0 && (
          <Link href={`/baca/${slug}/${chapters[chapters.length - 1].slug}`} className="bg-red-900 hover:bg-red-800 text-white p-4 rounded-2xl flex justify-between items-center transition-all shadow-[0_0_15px_rgba(127,29,29,0.3)] border border-red-800">
            <div className="flex flex-col">
              <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider">Mulai Baca</span>
              <span className="text-sm font-extrabold text-white mt-0.5">{chapters[chapters.length - 1].name}</span>
            </div>
            <span className="bg-black/30 px-4 py-2 rounded-xl text-xs font-bold">Mulai ▶</span>
          </Link>
        )}

        {/* SINOPSIS */}
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sinopsis</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{manga.synopsis || "Tidak ada sinopsis."}</p>
        </div>

        {/* DAFTAR CHAPTER */}
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daftar Chapter</h3>
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
            {chapters.map((ch: any) => (
              <Link key={ch.slug} href={`/baca/${slug}/${ch.slug}`} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-red-900/20 border border-white/5 hover:border-red-900/40 text-xs transition-colors">
                <span className="font-bold text-gray-300">{ch.name}</span>
                <span className="text-[10px] text-gray-500">Baca</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
            }
