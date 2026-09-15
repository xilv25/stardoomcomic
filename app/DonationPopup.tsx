'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DonationPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Tampilkan pop-up setelah 3 detik web dibuka
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem('hasSeenDonation');
      if (!hasSeen) {
        setIsOpen(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    // Simpan ke local storage supaya tidak muncul lagi di sesi ini
    localStorage.setItem('hasSeenDonation', 'true'); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900"></div>
        <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-3 border border-red-900/30">
          <span className="text-xl">☕</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Dukung StarDoom!</h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Suka baca komik di sini? Yuk bantu admin bayar server biar komik lancar terus dan update tiap hari!
        </p>
        <div className="flex w-full gap-3">
          <button onClick={closePopup} className="flex-1 py-3 rounded-xl bg-[#222] text-gray-300 text-xs font-bold hover:bg-[#333] transition-colors border border-white/5">
            Nanti Saja
          </button>
          <Link href="/donasi" onClick={closePopup} className="flex-1 py-3 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(153,27,27,0.4)]">
            Donasi Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
