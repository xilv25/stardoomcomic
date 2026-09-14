'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function SemuaPengumumanPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
      setLoading(false);
    };

    fetchAllAnnouncements();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-red-900/50">
      
      <header className="sticky top-0 z-50 px-4 py-4 flex items-center gap-4 bg-[#050505]/90 backdrop-blur border-b border-white/5">
        <button onClick={() => router.back()} className="w-9 h-9 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/5 transition-colors">
          ←
        </button>
        <h1 className="text-sm font-bold text-gray-200">Semua Pengumuman</h1>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-6">
        {loading ? (
          <div className="text-center text-xs text-red-800 font-bold mt-10">Memuat pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-xs text-gray-500 mt-10">Belum ada pengumuman.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="flex gap-3 bg-[#111] border border-white/5 p-4 rounded-2xl items-center shadow-md">
                <div className="w-10 h-10 rounded-xl bg-red-900/20 shrink-0 flex items-center justify-center border border-red-900/40">
                  <span className="text-red-800 font-extrabold text-lg">!</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-gray-200">{ann.title}</span>
                  <span className="text-[10px] text-gray-500 mt-1">{ann.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
