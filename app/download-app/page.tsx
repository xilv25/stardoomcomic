'use client';

import Link from 'next/link';

export default function DownloadAppPage() {
  
  // Karena kamu meletakkan file di folder 'public', kita panggil langsung dari root
  const apkFilePath = "/sdc-app.apk"; 

  return (
    <main className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Effect */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-800/30 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Konten Utama */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
        
        {/* Ikon App */}
        <div className="w-20 h-20 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-center shadow-lg mb-6 relative">
           <span className="text-2xl font-black text-red-600">SDC</span>
           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
             <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
           </div>
        </div>

        <h1 className="text-xl font-extrabold text-white mb-2">Aplikasi StarDoom Comic</h1>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Nikmati pengalaman membaca yang lebih cepat dan nyaman. Install aplikasi SDC sekarang secara gratis.
        </p>

        {/* Kotak Info Versi */}
        <div className="w-full bg-[#111] border border-white/5 rounded-xl p-3 flex justify-between items-center mb-6">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Versi Saat Ini</span>
          <span className="text-xs font-bold text-gray-300">v1.0 (Stable)</span>
        </div>

        {/* Tombol Download APK - Atribut 'download' memaksa browser mengunduh file */}
        <a 
          href={apkFilePath} 
          download="StarDoom-Comic.apk" 
          className="w-full bg-red-900 hover:bg-red-800 border border-red-800 text-white font-bold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(127,29,29,0.3)] transition-all flex justify-center items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Unduh File APK
        </a>

        {/* Peringatan Instalasi */}
        <p className="text-[9px] text-gray-500 italic mt-2 px-2">
          *Jika muncul peringatan keamanan saat instalasi, abaikan dan pilih "Tetap Install" (Install Anyway). Ini adalah hal wajar untuk aplikasi dari luar Play Store.
        </p>
      </div>

      {/* Tombol Kembali */}
      <div className="mt-8 relative z-10">
        <Link href="/profile" className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Kembali ke Profil
        </Link>
      </div>

    </main>
  );
          }
