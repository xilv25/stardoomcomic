'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pengumuman'); // pengumuman, iklan, role
  
  // State Pengumuman
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const annFileRef = useRef(null);

  // State Iklan
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adsList, setAdsList] = useState([]);
  const adFileRef = useRef(null);

  // State Roles
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#ff0000');
  const [rolesList, setRolesList] = useState([]);
  const [usersWithRoles, setUsersWithRoles] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tanggal Hari Ini (WIB)
  const todayWIB = new Date().toLocaleDateString('id-ID', { 
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' 
  });

  // Proteksi & Load Data
  useEffect(() => {
    const initAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
        fetchAds();
        fetchRolesAndUsers();
      } else {
        alert('Akses Ditolak! Halaman ini khusus Admin.');
        router.push('/profile');
      }
      setLoading(false);
    };

    initAdmin();
  }, [router]);

  // Fungsi Helper Upload Gambar
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('admin-uploads').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('admin-uploads').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ---------------- FEATURE: PENGUMUMAN ----------------
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      const file = annFileRef.current?.files[0];
      if (file) imageUrl = await uploadImage(file);

      const { error } = await supabase.from('announcements').insert([{ 
        title: annTitle, 
        content: annContent,
        image_url: imageUrl,
        date: todayWIB 
      }]);

      if (error) throw error;
      alert('Pengumuman berhasil di-publish!');
      setAnnTitle(''); setAnnContent('');
      if (annFileRef.current) annFileRef.current.value = '';
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- FEATURE: IKLAN ----------------
  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (data) setAdsList(data);
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const file = adFileRef.current?.files[0];
      if (!file) throw new Error("Gambar iklan wajib diisi!");
      
      const imageUrl = await uploadImage(file);
      const { error } = await supabase.from('ads').insert([{ 
        title: adTitle, description: adDesc, link: adLink, image_url: imageUrl 
      }]);

      if (error) throw error;
      alert('Iklan berhasil ditambahkan!');
      setAdTitle(''); setAdDesc(''); setAdLink('');
      if (adFileRef.current) adFileRef.current.value = '';
      fetchAds();
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!confirm("Hapus iklan ini?")) return;
    await supabase.from('ads').delete().eq('id', id);
    fetchAds();
  };

  // ---------------- FEATURE: ROLES ----------------
  const fetchRolesAndUsers = async () => {
    const { data: roles } = await supabase.from('roles').select('*');
    if (roles) setRolesList(roles);

    const { data: users } = await supabase.from('profiles').select('id, username, role').neq('role', 'user');
    if (users) setUsersWithRoles(users);
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('roles').upsert([{ 
        name: roleName.toLowerCase(), color: roleColor 
      }]);
      if (error) throw error;
      alert('Role berhasil disimpan!');
      setRoleName('');
      fetchRolesAndUsers();
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (!confirm(`Hapus role ${roleName}? (User dengan role ini akan tetap ada tapi kehilangan warnanya)`)) return;
    await supabase.from('roles').delete().eq('name', roleName);
    fetchRolesAndUsers();
  };

  const handleRemoveUserRole = async (userId) => {
    if (!confirm("Copot role dari user ini (kembali jadi user biasa)?")) return;
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId);
    fetchRolesAndUsers();
  };

  if (loading) return <main className="min-h-screen bg-[#050505] flex items-center justify-center text-red-900 font-bold">Memverifikasi Otoritas...</main>;
  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20 font-sans selection:bg-red-900/50 relative">
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-red-900/40 to-[#050505] z-0 pointer-events-none"></div>

      <header className="relative z-10 px-4 py-5 flex items-center gap-4 border-b border-white/5 bg-[#050505]/50 backdrop-blur-md sticky top-0">
        <button onClick={() => router.push('/profile')} className="w-10 h-10 bg-[#111] border border-white/10 rounded-full flex items-center justify-center text-lg hover:bg-white/5 transition-colors">←</button>
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold tracking-widest text-red-500 drop-shadow-md">ADMIN CONTROL</h1>
          <span className="text-[10px] text-gray-400">Pusat Komando SDC</span>
        </div>
      </header>

      {/* MENU TABS */}
      <div className="relative z-10 px-4 mt-6 max-w-xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
        {['pengumuman', 'iklan', 'role'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-red-900 text-white shadow-[0_0_15px_rgba(127,29,29,0.4)]' : 'bg-[#111] text-gray-400 hover:bg-white/5'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="relative z-10 px-4 max-w-xl mx-auto mt-6 flex flex-col gap-6">
        
        {/* ================= TAB: PENGUMUMAN ================= */}
        {activeTab === 'pengumuman' && (
          <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg animate-fade-in">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 border-b border-white/5 pb-3">📢 Buat Pengumuman</h2>
            <form onSubmit={handleAddAnnouncement} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Judul (Wajib)</label>
                <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="Judul singkat..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Isi Detail Pengumuman</label>
                <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800 min-h-[100px]" placeholder="Penjelasan lengkap saat user klik pengumuman..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Gambar (Opsional)</label>
                <input type="file" accept="image/*" ref={annFileRef} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs" />
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-500">Tanggal otomatis di-set ke: <strong className="text-gray-300">{todayWIB}</strong></span>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-red-900 hover:bg-red-800 text-white font-extrabold py-3.5 rounded-xl shadow-[0_0_15px_rgba(127,29,29,0.4)] transition-all text-xs disabled:opacity-50">
                {isSubmitting ? 'Memproses...' : 'Publish Pengumuman'}
              </button>
            </form>
          </section>
        )}

        {/* ================= TAB: IKLAN ================= */}
        {activeTab === 'iklan' && (
          <div className="animate-fade-in flex flex-col gap-6">
            <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 border-b border-white/5 pb-3">🖼️ Tambah Iklan / Sponsor</h2>
              <form onSubmit={handleAddAd} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Judul Iklan</label>
                  <input required value={adTitle} onChange={(e) => setAdTitle(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="Contoh: Baca di Komiku.id" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Deskripsi Singkat</label>
                  <input value={adDesc} onChange={(e) => setAdDesc(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="Update Setiap Minggu..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Link Tujuan URL (Wajib)</label>
                  <input required type="url" value={adLink} onChange={(e) => setAdLink(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="https://..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Banner Gambar (Wajib)</label>
                  <input required type="file" accept="image/*" ref={adFileRef} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3.5 rounded-xl shadow-[0_0_15px_rgba(30,58,138,0.4)] transition-all text-xs disabled:opacity-50">
                  {isSubmitting ? 'Upload...' : 'Pasang Iklan'}
                </button>
              </form>
            </section>

            <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Daftar Iklan Aktif</h3>
              <div className="flex flex-col gap-4">
                {adsList.length === 0 ? <p className="text-xs text-gray-600 text-center py-4">Belum ada iklan.</p> : adsList.map(ad => (
                  <div key={ad.id} className="flex flex-col bg-[#050505] rounded-xl overflow-hidden border border-white/10">
                    <img src={ad.image_url} alt="Ad" className="w-full h-24 object-cover opacity-80" />
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex flex-col max-w-[70%]">
                        <span className="text-xs font-bold text-white truncate">{ad.title}</span>
                        <span className="text-[9px] text-blue-400 truncate">{ad.link}</span>
                      </div>
                      <button onClick={() => handleDeleteAd(ad.id)} className="bg-red-900/40 text-red-500 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-900/30">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB: ROLES & USERS ================= */}
        {activeTab === 'role' && (
          <div className="animate-fade-in flex flex-col gap-6">
            
            {/* Buat Role Baru + Color Picker */}
            <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4 border-b border-white/5 pb-3">🛡️ Setup Role Colors</h2>
              <form onSubmit={handleAddRole} className="flex gap-3 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Nama Role</label>
                  <input required value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-800" placeholder="vip, uploader, dll" />
                </div>
                
                {/* COLOR PICKER NATIVE MANTAP */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-[10px] text-gray-400 font-bold uppercase text-center">Warna</label>
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/20 shadow-md">
                    <input type="color" value={roleColor} onChange={(e) => setRoleColor(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="h-11 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-xs border border-white/10">
                  Save
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {rolesList.map(r => (
                  <div key={r.name} className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full border border-white/10 bg-[#050505]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></span>
                    <span className="text-[10px] font-bold text-gray-300 uppercase">{r.name}</span>
                    <button onClick={() => handleDeleteRole(r.name)} className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white/5 ml-1">×</button>
                  </div>
                ))}
              </div>
            </section>

            {/* List User dengan Role Khusus */}
            <section className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Daftar Akun Pengurus</h3>
              <div className="flex flex-col gap-3">
                {usersWithRoles.length === 0 ? <p className="text-xs text-gray-600 text-center py-2">Belum ada akun dengan role khusus.</p> : usersWithRoles.map(u => {
                  const roleObj = rolesList.find(r => r.name === u.role);
                  const color = roleObj ? roleObj.color : '#888';
                  
                  return (
                    <div key={u.id} className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{u.username || 'User Anonim'}</span>
                        <span className="text-[9px] font-extrabold uppercase mt-1 px-1.5 py-0.5 rounded w-max" style={{ backgroundColor: `${color}30`, color: color, border: `1px solid ${color}50` }}>
                          {u.role}
                        </span>
                      </div>
                      <button onClick={() => handleRemoveUserRole(u.id)} className="text-[10px] text-gray-500 hover:text-red-500 font-bold border border-white/5 px-3 py-1.5 rounded-lg">Copot Role</button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-gray-500 mt-4 text-center italic">*Assign role ke akun baru saat ini dilakukan via Supabase Dashboard.</p>
            </section>
          </div>
        )}

      </div>
    </main>
  );
      }
