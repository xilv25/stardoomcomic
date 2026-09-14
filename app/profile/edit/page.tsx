'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function EditProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url, cover_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setCoverUrl(data.cover_url || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      })
      .eq('id', session.user.id);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Profil berhasil diperbarui!');
      router.push('/profile');
      router.refresh(); // Memaksa halaman profile mengambil data terbaru
    }
    setSaving(false);
  };

  if (loading) return <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-bold text-red-900">Memuat...</main>;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-red-900/50">
      
      <header className="sticky top-0 z-50 px-4 py-4 flex items-center gap-4 bg-[#050505]/90 backdrop-blur border-b border-white/5">
        <button onClick={() => router.back()} className="w-9 h-9 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/5 transition-colors">
          ←
        </button>
        <h1 className="text-sm font-bold text-gray-200">Edit Profil</h1>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-6">
        <form onSubmit={handleUpdate} className="bg-[#111] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Bio Singkat</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">URL Foto Profil (Avatar)</label>
            <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">URL Background Cover (Support .gif / Gambar)</label>
            <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://...file.gif" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl mt-4 border border-red-800 transition-all text-xs disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </main>
  );
}
