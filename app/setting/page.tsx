'use client';

import { useRouter } from 'next/navigation';

export default function SettingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-10 font-sans selection:bg-red-900/50">
      
      <header className="sticky top-0 z-50 px-4 py-4 flex items-center gap-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={() => router.back()} className="w-10 h-10 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/5 transition-colors">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-200">Pengaturan</h1>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-6 flex flex-col gap-6">
        
        {/* PREFERENSI */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider ml-1">Preferensi Aplikasi</h3>
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-300">Mode Hemat Kuota</span>
                <span className="text-[10px] text-gray-500">Turunkan resolusi gambar otomatis</span>
              </div>
              <input type="checkbox" className="toggle-checkbox w-10 h-5 bg-black rounded-full appearance-none border border-white/20 checked:bg-red-900 checked:border-red-800 transition-colors relative" />
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-300">Notifikasi Update</span>
                <span className="text-[10px] text-gray-500">Beritahu jika ada chapter komik favorit</span>
              </div>
              <input type="checkbox" defaultChecked className="toggle-checkbox w-10 h-5 bg-black rounded-full appearance-none border border-white/20 checked:bg-red-900 checked:border-red-800 transition-colors relative" />
            </div>
          </div>
        </div>

        {/* AKUN & DATA */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider ml-1">Akun & Data</h3>
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
            <button className="text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <span className="text-sm font-bold text-gray-300">Bersihkan Cache (32 MB)</span>
            </button>
            <button className="text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <span className="text-sm font-bold text-gray-300">Syarat & Ketentuan</span>
            </button>
            <button className="text-left p-4 hover:bg-white/5 transition-colors">
              <span className="text-sm font-bold text-red-500">Keluar (Logout)</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">StarDoom Comic v1.0.0</p>
        </div>

      </div>
    </main>
  );
}
