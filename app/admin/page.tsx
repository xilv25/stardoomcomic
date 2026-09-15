'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pengumuman'); 
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // State Pengumuman
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const annFileRef = useRef<HTMLInputElement>(null);

  // State Iklan
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adsList, setAdsList] = useState<any[]>([]);
  const adFileRef = useRef<HTMLInputElement>(null);

  // State Roles
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#8B0000'); // Default lebih gelap
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayWIB = new Date().toLocaleDateString('id-ID', { 
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' 
  });

  useEffect(() => {
    const initAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const userId = session.user.id;
        setCurrentUserId(userId);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (profile?.role === 'admin') {
          setIsAdmin(true);
          fetchAds();
          fetchRolesAndUsers();
        } else {
          alert('Akses Ditolak. Area ini dibatasi.');
          router.push('/profile');
        }
      } catch (err) {
        console.error("Error init admin:", err);
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    };

    initAdmin();
  }, [router]);

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('admin-uploads').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('admin-uploads').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      const file = annFileRef.current?.files?.[0];
      if (file) imageUrl = await uploadImage(file);

      // PERBAIKAN: Mengirimkan user_id jika diperlukan oleh tabel
      const { error } = await supabase.from('announcements').insert([{ 
        title: annTitle, 
        content: annContent,
        image_url: imageUrl,
        date: todayWIB,
        user_id: currentUserId 
      }]);

      if (error) throw error;
      alert('Pengumuman berhasil dipublikasikan.');
      setAnnTitle(''); setAnnContent('');
      if (annFileRef.current) annFileRef.current.value = '';
    } catch (error: any) {
      alert(`Gagal menyimpan pengumuman: ${error.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (data) setAdsList(data);
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const file = adFileRef.current?.files?.[0];
      if (!file) throw new Error("File banner wajib disertakan.");
      
      const imageUrl = await uploadImage(file);
      
      // PERBAIKAN: Mengirimkan user_id jika diperlukan oleh tabel
      const { error } = await supabase.from('ads').insert([{ 
        title: adTitle, 
        description: adDesc, 
        link: adLink, 
        image_url: imageUrl,
        user_id: currentUserId 
      }]);

      if (error) throw error;
      alert('Sponsor berhasil ditambahkan.');
      setAdTitle(''); setAdDesc(''); setAdLink('');
      if (adFileRef.current) adFileRef.current.value = '';
      fetchAds();
    } catch (error: any) {
      alert(`Gagal menyimpan sponsor: ${error.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Konfirmasi penghapusan data ini?")) return;
    await supabase.from('ads').delete().eq('id', id);
    fetchAds();
  };

  const fetchRolesAndUsers = async () => {
    const { data: roles } = await supabase.from('roles').select('*');
    if (roles) setRolesList(roles);

    const { data: users } = await supabase.from('profiles').select('id, username, role').neq('role', 'user');
    if (users) setUsersWithRoles(users);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('roles').upsert([{ 
        name: roleName.toLowerCase(), 
        color: roleColor 
      }]);
      if (error) throw error;
      alert('Konfigurasi role diperbarui.');
      setRoleName('');
      fetchRolesAndUsers();
    } catch (error: any) {
      alert(`Gagal menyimpan role: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`Hapus konfigurasi role '${roleName}'?`)) return;
    await supabase.from('roles').delete().eq('name', roleName);
    fetchRolesAndUsers();
  };

  const handleRemoveUserRole = async (userId: string) => {
    if (!confirm("Cabut otorisasi khusus dari pengguna ini?")) return;
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId);
    fetchRolesAndUsers();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-400 text-sm tracking-widest font-medium uppercase">
        Memverifikasi Otoritas...
      </main>
    );
  }
  
  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-[#020202] text-gray-300 pb-20 font-sans selection:bg-red-900/30">
      {/* Header Minimalist & Professional */}
      <header className="sticky top-0 z-50 px-4 py-4 flex items-center gap-4 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={() => router.push('/profile')} 
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-gray-100 tracking-wide">SDC Command Center</h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Administration</span>
        </div>
      </header>

      <div className="px-4 max-w-2xl mx-auto mt-6">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6 border-b border-white/5">
          {[
            { id: 'pengumuman', label: 'Pengumuman' },
            { id: 'iklan', label: 'Manajemen Sponsor' },
            { id: 'role', label: 'Otoritas & Peran' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-gray-100 border-red-800 bg-white/5' 
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          
          {/* ================= TAB: PENGUMUMAN ================= */}
          {activeTab === 'pengumuman' && (
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl animate-fade-in">
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-200">Publikasi Pengumuman</h2>
                <p className="text-[11px] text-gray-500 mt-1">Buat informasi publik yang akan ditampilkan di halaman utama.</p>
              </div>
              
              <form onSubmit={handleAddAnnouncement} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-gray-400">Judul Pengumuman</label>
                  <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 transition-colors" placeholder="Masukkan judul..." />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-gray-400">Isi / Keterangan</label>
                  <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 transition-colors min-h-[120px] resize-y" placeholder="Detail pengumuman (mendukung teks panjang)..." />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-gray-400">Lampiran Media (Opsional)</label>
                  <input type="file" accept="image/*" ref={annFileRef} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:text-[11px] file:font-medium hover:file:bg-white/20 transition-all cursor-pointer" />
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-500">Tanggal efektif: <span className="text-gray-300">{todayWIB}</span></span>
                  <button type="submit" disabled={isSubmitting} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 border border-white/5">
                    {isSubmitting ? 'Memproses...' : 'Publikasikan'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ================= TAB: IKLAN / SPONSOR ================= */}
          {activeTab === 'iklan' && (
            <div className="animate-fade-in flex flex-col gap-6">
              <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-gray-200">Registrasi Sponsor Baru</h2>
                  <p className="text-[11px] text-gray-500 mt-1">Tambahkan banner promosi untuk ditampilkan pada area khusus.</p>
                </div>
                
                <form onSubmit={handleAddAd} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-gray-400">Nama/Judul Kampanye</label>
                      <input required value={adTitle} onChange={(e) => setAdTitle(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 transition-colors" placeholder="Contoh: Event Baca Komik..." />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-gray-400">Deskripsi Internal</label>
                      <input value={adDesc} onChange={(e) => setAdDesc(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 transition-colors" placeholder="Catatan singkat (opsional)..." />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-400">URL Tujuan (Tautan)</label>
                    <input required type="url" value={adLink} onChange={(e) => setAdLink(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 transition-colors" placeholder="https://..." />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-400">Aset Banner (Diperlukan)</label>
                    <input required type="file" accept="image/*" ref={adFileRef} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:text-[11px] file:font-medium hover:file:bg-white/20 transition-all cursor-pointer" />
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={isSubmitting} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 border border-white/5">
                      {isSubmitting ? 'Mengunggah...' : 'Simpan Sponsor'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                <h3 className="text-xs font-semibold text-gray-400 mb-4 pb-3 border-b border-white/5">Direktori Sponsor Aktif</h3>
                <div className="flex flex-col gap-3">
                  {adsList.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                      <span className="text-[11px] text-gray-600">Tidak ada data sponsor aktif saat ini.</span>
                    </div>
                  ) : (
                    adsList.map(ad => (
                      <div key={ad.id} className="flex gap-4 items-center bg-[#111] p-3 rounded-xl border border-white/5">
                        <div className="w-20 h-14 shrink-0 rounded-md overflow-hidden bg-black/50 border border-white/5">
                          <img src={ad.image_url} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[12px] font-semibold text-gray-200 truncate">{ad.title}</span>
                          <a href={ad.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400/80 hover:text-blue-400 truncate mt-0.5">{ad.link}</a>
                        </div>
                        <button onClick={() => handleDeleteAd(ad.id)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB: ROLES & USERS ================= */}
          {activeTab === 'role' && (
            <div className="animate-fade-in flex flex-col gap-6">
              
              <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-gray-200">Konfigurasi Klasifikasi Peran</h2>
                  <p className="text-[11px] text-gray-500 mt-1">Kelola jenis peran (roles) beserta atribut visualnya.</p>
                </div>
                
                <form onSubmit={handleAddRole} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-gray-400">Identitas Peran (Nama)</label>
                    <input required value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="admin, moderator, dll" />
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    <label className="text-[11px] font-semibold text-gray-400">Kode Warna</label>
                    <div className="relative w-full sm:w-20 h-[42px] rounded-lg overflow-hidden border border-white/10 bg-[#111]">
                      <input type="color" value={roleColor} onChange={(e) => setRoleColor(e.target.value)} className="absolute -top-2 -left-2 w-28 h-28 cursor-pointer" />
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 h-[42px] rounded-lg text-[12px] font-bold transition-all border border-white/5">
                    Terapkan
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap gap-2">
                  {rolesList.map(r => (
                    <div key={r.name} className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-md border border-white/5 bg-[#111]">
                      <span className="w-2 h-2 rounded-sm shadow-sm" style={{ backgroundColor: r.color }}></span>
                      <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">{r.name}</span>
                      <button onClick={() => handleDeleteRole(r.name)} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white/5 ml-1 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                <h3 className="text-xs font-semibold text-gray-400 mb-4 pb-3 border-b border-white/5">Tinjauan Otoritas Pengguna</h3>
                <div className="flex flex-col gap-2">
                  {usersWithRoles.length === 0 ? (
                     <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                      <span className="text-[11px] text-gray-600">Tidak ada pengguna dengan otoritas khusus.</span>
                     </div>
                  ) : usersWithRoles.map(u => {
                    const roleObj = rolesList.find(r => r.name === u.role);
                    const color = roleObj ? roleObj.color : '#555';
                    
                    return (
                      <div key={u.id} className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-gray-200">{u.username || 'Pengguna Tanpa Nama'}</span>
                            <div className="flex mt-1">
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                                {u.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveUserRole(u.id)} className="text-[10px] text-gray-400 hover:text-red-400 font-medium px-3 py-1.5 rounded-md hover:bg-red-900/10 transition-colors">
                          Demote
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-600 mt-5 pt-3 border-t border-white/5">
                  Otorisasi awal (assign role) dilakukan melalui panel kontrol utama basis data (Supabase).
                </p>
              </section>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
