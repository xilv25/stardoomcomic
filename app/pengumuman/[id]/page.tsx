'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../utils/supabase'; // Pastikan path ke supabase benar, sesuaikan jumlah ../ jika perlu
import Link from 'next/link';

export default function PengumumanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncementDetail = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setAnnouncement(data);
      } catch (err: any) {
        console.error("Error fetching detail pengumuman:", err);
        setError("Pengumuman tidak ditemukan atau telah dihapus.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncementDetail();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-400 text-sm tracking-widest font-medium uppercase animate-pulse">
        Memuat Detail...
      </main>
    );
  }

  if (error || !announcement) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center border border-red-900/40 mb-4">
          <span className="text-red-500 font-extrabold text-2xl">!</span>
        </div>
        <h1 className="text-lg font-bold text-gray-200 mb-2">Terjadi Kesalahan</h1>
        <p className="text-gray-500 text-xs mb-6 text-center">{error || "Data tidak valid."}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-[#111] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-colors">
          Kembali
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020202] text-gray-300 pb-20 font-sans selection:bg-red-900/30">
      
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 px-4 py-4 flex items-center justify-between bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#111] hover:bg-white/10 border border-white/5 transition-all text-gray-400 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Update Info</span>
          <span className="text-xs font-bold text-red-700">SDC<span className="text-white">.</span></span>
        </div>
      </header>

      <div className="max-w-xl mx-auto flex flex-col animate-fade-in relative">
        
        {/* Gambar Cover Pengumuman (Jika ada) */}
        {announcement.image_url ? (
          <div className="w-full aspect-video bg-[#111] relative overflow-hidden border-b border-white/5">
            <img 
              src={announcement.image_url} 
              alt="Lampiran Pengumuman" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-16 bg-gradient-to-b from-red-900/10 to-[#020202]"></div>
        )}

        {/* Konten Detail */}
        <article className={`px-5 ${announcement.image_url ? '-mt-10 relative z-10' : 'mt-2'}`}>
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            
            {/* Dekorasi kecil */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-900/20 text-red-500 text-[9px] font-extrabold px-2 py-0.5 rounded border border-red-900/30 uppercase tracking-wider">
                Pengumuman
              </span>
              <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {announcement.date}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-gray-100 leading-tight mb-6">
              {announcement.title}
            </h1>

            <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6"></div>

            {/* Area Teks Panjang */}
            <div className="text-[13px] md:text-[14px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
              {announcement.content}
            </div>
            
          </div>
        </article>

        {/* Footer Navigation (Opsional) */}
        <div className="px-5 mt-8 mb-10">
           <Link href="/pengumuman" className="w-full py-4 bg-[#111] hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between px-5 transition-colors group shadow-md">
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Lihat Lainnya</span>
               <span className="text-xs font-bold text-gray-300">Semua Pengumuman</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-900/20 group-hover:text-red-500 transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
             </div>
           </Link>
        </div>

      </div>
    </main>
  );
}
