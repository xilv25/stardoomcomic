'use client';

import { useRouter } from 'next/navigation';

export default function DonasiPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 flex flex-col items-center justify-center font-sans selection:bg-red-900/50 relative">
      <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 bg-[#111] border border-white/5 rounded-full flex items-center justify-center hover:bg-[#222] transition-colors shadow-md">
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </button>
      
      <div className="w-full max-w-sm flex flex-col items-center text-center mt-8">
        <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mb-4 border border-red-900/50 shadow-[0_0_15px_rgba(153,27,27,0.3)]">
          <span className="text-3xl">☕</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-2 text-white">Dukung StarDoom</h1>
        <p className="text-gray-400 text-xs mb-8 leading-relaxed">
          Traktir admin ngopi biar makin semangat update komik setiap hari! Dukunganmu sangat berarti buat biaya server.
        </p>
        
        <div className="bg-white p-4 rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-6">
          {/* Pastikan file qris.jpg ada di folder public */}
          <img src="/qris.jpg" alt="QRIS Donasi" className="w-64 h-64 object-cover rounded-xl" />
        </div>
        
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Scan QRIS menggunakan e-Wallet / m-Banking
        </p>
      </div>
    </main>
  );
}
