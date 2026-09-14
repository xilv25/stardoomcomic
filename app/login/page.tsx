'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';// Pastikan path ini sesuai
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/profile');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Auto login setelah daftar (karena confirm email dimatikan)
        await supabase.auth.signInWithPassword({ email, password });
        
        // Jadikan pendaftar pertama otomatis jadi Admin (Opsional, tapi mempermudahmu)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update username default
          await supabase.from('profiles').update({ 
            username: email.split('@')[0] 
          }).eq('id', user.id);
        }
        router.push('/profile');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative selection:bg-red-900/50">
      
      {/* Background Glow */}
      <div className="absolute top-0 w-full h-[40vh] bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none"></div>

      <button onClick={() => router.back()} className="absolute top-6 left-4 w-10 h-10 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/5 transition-colors z-10">
        ←
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-900/80 border border-red-800/50 rounded-2xl mx-auto flex items-center justify-center font-extrabold text-white text-3xl shadow-[0_0_20px_rgba(127,29,29,0.5)] mb-4">S</div>
          <h1 className="text-2xl font-extrabold tracking-widest">SDC<span className="text-red-900">.</span></h1>
          <p className="text-gray-500 text-xs mt-1">Masuk untuk menyimpan komik favoritmu</p>
        </div>

        <form onSubmit={handleAuth} className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-4">
          
          <div className="flex bg-[#050505] rounded-xl p-1 border border-white/5 mb-2">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-red-900/80 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Masuk</button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-red-900/80 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Daftar</button>
          </div>

          {errorMsg && <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-[11px] p-3 rounded-xl text-center font-bold">{errorMsg}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors" placeholder="nama@email.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors" placeholder="Minimal 6 karakter" minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl mt-4 shadow-[0_0_15px_rgba(127,29,29,0.4)] border border-red-800 transition-all text-sm disabled:opacity-50">
            {loading ? 'Memproses...' : (isLogin ? 'Masuk Sekarang' : 'Buat Akun')}
          </button>
        </form>
      </div>
    </main>
  );
            }
