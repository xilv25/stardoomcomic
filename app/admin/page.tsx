'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk form Pengumuman
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proteksi Keamanan Admin
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        alert('Akses Ditolak! Halaman ini khusus Admin.');
        router.push('/profile');
      }
      setLoading(false);
    };

    checkAccess();
  }, [router]);

  // Fungsi Tambah Pengumuman ke Database
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('announcements')
      .insert([{ title, date }]);

    if (error) {
      alert('Gagal menambahkan pengumuman: ' + error.message);
    } else {
      alert('Pengumuman berhasil di-publish!');
      setTitle('');
      setDate('');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return <main className="min-h-screen bg-[#050505] flex items-center justify-center text-red-900 font-bold">Memverifikasi Otoritas...</main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-red-900/50 relative">
      
      {/* Background Admin */}
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-red-900/40 to-[#050505] z-0 pointer-events-none"></div>

      <header className="relative z-10 px-4 py-5 flex items-center gap-4 border-b border-white/5 bg-[#050505]/50 backdrop-blur-md">
        <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/5 transition-colors">
          ←
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold tracking-widest text-red-500 drop-shadow-md">ADMIN CONTROL</h1>
          <span className="text-[10px] text-gray-400">Pusat Komando SDC</span>
        </div>
      </header>

      <div className="relative z-10 px-4 max-w-xl mx-auto mt-6 flex flex-col gap-8">
        
        {/* PANEL: TAMBAH PENGUMUMAN */}
        <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
            <div className="w-8 h-8 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500 border border-red-900/30">📢</div>
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Buat Pengumuman</h2>
          </div>
          
          <form onSubmit={handleAddAnnouncement} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Isi Pengumuman</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800 transition-colors" 
                placeholder="Contoh: Premium cuma Rp 12.500!" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Tanggal Berlaku</label>
              <input 
                type="text" 
                required 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800 transition-colors" 
                placeholder="Contoh: 16 November 2026" 
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl mt-2 shadow-[0_0_15px_rgba(127,29,29,0.4)] border border-red-800 transition-all text-xs disabled:opacity-50">
              {isSubmitting ? 'Mem-publish...' : 'Publish Pengumuman'}
            </button>
          </form>
        </section>

        {/* PANEL: TAMBAH SPONSOR (Bisa digarap berikutnya) */}
        <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg opacity-50 grayscale">
          <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-gray-500 border border-gray-800">🖼️</div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Manajemen Sponsor</h2>
          </div>
          <p className="text-xs text-gray-500 text-center py-4 font-bold">Fitur ini sedang dalam tahap pengembangan...</p>
        </section>

      </div>
    </main>
  );
            }
