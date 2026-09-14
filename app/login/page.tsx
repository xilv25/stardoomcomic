'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validasi Password Kuat: Min 8 char, ada Huruf Besar, Kecil, Angka, TANPA SIMBOL
  const validatePassword = (pass: string) => {
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);
    if (hasSymbol) return "Password tidak boleh mengandung simbol!";
    if (pass.length < 8) return "Password minimal 8 karakter!";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pass)) {
      return "Password harus gabungan Huruf Besar, Huruf Kecil, dan Angka!";
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!isLogin) {
      const passError = validatePassword(password);
      if (passError) {
        setErrorMsg(passError);
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/profile');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        await supabase.auth.signInWithPassword({ email, password });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
      
      <button onClick={() => router.back()} className="absolute top-6 left-4 w-9 h-9 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/5 transition-colors z-10">
        ←
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <h1 className="text-xl font-extrabold tracking-widest uppercase">SDC<span className="text-red-700">.</span></h1>
          <p className="text-gray-500 text-xs mt-1">Sistem Otentikasi Komik</p>
        </div>

        <form onSubmit={handleAuth} className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-4">
          
          <div className="flex bg-[#050505] rounded-xl p-1 border border-white/5 mb-2">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-red-900 text-white' : 'text-gray-500'}`}>Masuk</button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-red-900 text-white' : 'text-gray-500'}`}>Daftar</button>
          </div>

          {errorMsg && <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-[11px] p-3 rounded-xl text-center font-bold">{errorMsg}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="nama@email.com" />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-red-800" 
                placeholder="Min 8 char (Huruf & Angka)" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold hover:text-white"
              >
                {showPassword ? "Sembunyi" : "Lihat"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl mt-3 border border-red-800 transition-all text-xs disabled:opacity-50">
            {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Akun')}
          </button>
        </form>
      </div>
    </main>
  );
}
