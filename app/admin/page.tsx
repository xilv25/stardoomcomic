'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // Kasta tertinggi
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pengumuman'); 
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  
  // State Pengumuman
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annList, setAnnList] = useState<any[]>([]);
  const annFileRef = useRef<HTMLInputElement>(null);

  // State Iklan
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adsList, setAdsList] = useState<any[]>([]);
  const adFileRef = useRef<HTMLInputElement>(null);

  // State Roles & Otoritas
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#ff0000');
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<any[]>([]);
  
  // State Assign Role ke User Baru
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState('admin');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tanggal Hari Ini (WIB)
  const todayWIB = new Date().toLocaleDateString('id-ID', { 
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' 
  });

  // Proteksi & Load Data
  useEffect(() => {
    const initAdmin = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) return router.push('/login');

        const userId = session.user.id;
        setCurrentUserId(userId);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const role = profile?.role?.toLowerCase() || 'user';
        setCurrentUserRole(role);

        if (role === 'admin' || role === 'owner') {
          setIsAdmin(true);
          if (role === 'owner') setIsOwner(true);
          
          fetchAnnouncements();
          fetchAds();
          fetchRolesAndUsers();
        } else {
          alert('Akses Ditolak! Halaman ini khusus Admin/Owner.');
          router.push('/profile');
        }
      } catch (err) {
        console.error("Init Error:", err);
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    };

    initAdmin();
  }, [router]);

  // Fungsi Helper Upload Gambar
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    // Perbaikan potensi error upload
    const { error: uploadError } = await supabase.storage.from('admin-uploads').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
    if (uploadError) {
      console.error("Upload failed:", uploadError);
      throw new Error(`Gagal upload gambar ke bucket. Pastikan bucket 'admin-uploads' ada dan Public. (${uploadError.message})`);
    }
    
    const { data } = supabase.storage.from('admin-uploads').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ---------------- FEATURE: PENGUMUMAN ----------------
  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnList(data);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      const file = annFileRef.current?.files?.[0];
      if (file) imageUrl = await uploadImage(file);

      // Coba insert tanpa user_id dulu (banyak kasus RLS conflict karena foreign key)
      const insertData: any = { 
        title: annTitle, 
        content: annContent,
        date: todayWIB
      };
      if (imageUrl) insertData.image_url = imageUrl;
      
      const { error } = await supabase.from('announcements').insert([insertData]);

      if (error) {
         // Jika gagal tanpa user_id, coba dengan user_id
         console.warn("Insert gagal, mencoba dengan user_id...", error);
         insertData.user_id = currentUserId;
         const { error: retryError } = await supabase.from('announcements').insert([insertData]);
         if (retryError) throw retryError;
      }

      alert('Pengumuman berhasil di-publish!');
      setAnnTitle(''); setAnnContent('');
      if (annFileRef.current) annFileRef.current.value = '';
      fetchAnnouncements();
    } catch (error: any) {
      alert('Gagal mempublish: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  };

  // ---------------- FEATURE: IKLAN ----------------
  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (data) setAdsList(data);
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const file = adFileRef.current?.files?.[0];
      if (!file) throw new Error("Gambar iklan wajib diisi!");
      
      const imageUrl = await uploadImage(file);
      
      // Fallback RLS
      const insertData: any = { 
        title: adTitle, 
        description: adDesc, 
        link: adLink, 
        image_url: imageUrl
      };

      const { error } = await supabase.from('ads').insert([insertData]);

      if (error) {
        console.warn("Insert gagal, mencoba dengan user_id...", error);
        insertData.user_id = currentUserId;
        const { error: retryError } = await supabase.from('ads').insert([insertData]);
        if (retryError) throw retryError;
      }

      alert('Iklan berhasil ditambahkan!');
      setAdTitle(''); setAdDesc(''); setAdLink('');
      if (adFileRef.current) adFileRef.current.value = '';
      fetchAds();
    } catch (error: any) {
      alert('Gagal menambah iklan: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Hapus iklan ini?")) return;
    await supabase.from('ads').delete().eq('id', id);
    fetchAds();
  };

  // ---------------- FEATURE: ROLES & ASSIGNMENT ----------------
  const fetchRolesAndUsers = async () => {
    // Pastikan role OWNER selalu ada di list jika belum pernah dibuat
    const { data: roles } = await supabase.from('roles').select('*');
    if (roles) {
      if (!roles.find(r => r.name.toLowerCase() === 'owner')) {
        roles.unshift({ name: 'owner', color: '#ffcc00' }); // Kuning Gold untuk Owner
      }
      setRolesList(roles);
    }

    const { data: users } = await supabase.from('profiles').select('id, username, role').neq('role', 'user');
    if (users) setUsersWithRoles(users);
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const name = roleName.toLowerCase().trim();
      if (name === 'owner' && !isOwner) {
        throw new Error("Hanya OWNER yang dapat memodifikasi role OWNER.");
      }

      const { error } = await supabase.from('roles').upsert([{ name, color: roleColor }]);
      if (error) throw error;
      
      alert('Tipe Role berhasil disimpan!');
      setRoleName('');
      fetchRolesAndUsers();
    } catch (error: any) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleNameToDelete: string) => {
    if (roleNameToDelete.toLowerCase() === 'owner') {
      alert("Role OWNER adalah kasta tertinggi dan tidak dapat dihapus!");
      return;
    }
    if (!confirm(`Hapus konfigurasi role ${roleNameToDelete}?`)) return;
    
    await supabase.from('roles').delete().eq('name', roleNameToDelete);
    fetchRolesAndUsers();
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return alert("Masukkan username target!");
    setIsSubmitting(true);

    try {
      // 1. Cari user ID berdasarkan username
      const { data: targetUser, error: searchError } = await supabase
        .from('profiles')
        .select('id, role')
        .ilike('username', targetUsername.trim())
        .maybeSingle();

      if (searchError || !targetUser) throw new Error("Pengguna tidak ditemukan dengan username tersebut.");

      // 2. Proteksi Kasta (Hierarki)
      const targetCurrentRole = targetUser.role?.toLowerCase() || 'user';
      const roleToAssign = selectedRoleToAssign.toLowerCase();

      if (targetCurrentRole === 'owner' && !isOwner) {
        throw new Error("Admin biasa tidak bisa mengubah status seorang OWNER.");
      }
      if (roleToAssign === 'owner' && !isOwner) {
        throw new Error("Hanya OWNER yang bisa mengangkat OWNER baru.");
      }

      // 3. Update Role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: roleToAssign })
        .eq('id', targetUser.id);

      if (updateError) throw updateError;

      alert(`Sukses! ${targetUsername} sekarang adalah ${roleToAssign.toUpperCase()}.`);
      setTargetUsername('');
      fetchRolesAndUsers();
    } catch (error: any) {
      alert(`Gagal assign role: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUserRole = async (targetId: string, targetCurrentRole: string) => {
    // Proteksi Demote
    if (targetCurrentRole.toLowerCase() === 'owner' && !isOwner) {
      alert("Kamu bukan OWNER! Tidak bisa men-demote seorang OWNER.");
      return;
    }
    
    if (!confirm("Copot otoritas user ini dan kembalikan jadi user biasa?")) return;
    
    await supabase.from('profiles').update({ role: 'user' }).eq('id', targetId);
    fetchRolesAndUsers();
  };

  // ================= UI RENDER =================
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-500 text-sm uppercase tracking-widest">Memverifikasi Akses...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-gray-300 pb-20 font-sans selection:bg-red-900/30 relative">
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-red-900/10 to-[#020202] z-0 pointer-events-none"></div>

      <header className="relative z-10 px-4 py-4 flex items-center gap-4 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 sticky top-0">
        <button onClick={() => router.push('/profile')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-gray-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
             <h1 className="text-sm font-bold text-gray-100 tracking-wide">SDC Command Center</h1>
             {isOwner && <span className="bg-yellow-500/20 text-yellow-500 text-[8px] px-1.5 py-0.5 rounded border border-yellow-500/30 font-black">OWNER</span>}
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Administration</span>
        </div>
      </header>

      {/* MENU TABS */}
      <div className="relative z-10 px-4 mt-6 max-w-xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2 border-b border-white/5">
        {[
          { id: 'pengumuman', label: 'Pengumuman' },
          { id: 'iklan', label: 'Sponsor' },
          { id: 'role', label: 'Otoritas' }
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

      <div className="relative z-10 px-4 max-w-xl mx-auto mt-4 flex flex-col gap-6">
        
        {/* ================= TAB: PENGUMUMAN ================= */}
        {activeTab === 'pengumuman' && (
          <div className="animate-fade-in flex flex-col gap-6">
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-gray-200">Publikasi Pengumuman</h2>
                <p className="text-[11px] text-gray-500 mt-1">Buat informasi publik yang akan ditampilkan di halaman utama.</p>
              </div>
              <form onSubmit={handleAddAnnouncement} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Judul Pengumuman</label>
                  <input required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="Masukkan judul..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Isi / Keterangan</label>
                  <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 min-h-[100px]" placeholder="Detail pengumuman..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Lampiran Gambar (Opsional)</label>
                  <input type="file" accept="image/*" ref={annFileRef} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:text-[11px]" />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500">Tanggal: <span className="text-gray-300">{todayWIB}</span></span>
                    <button type="submit" disabled={isSubmitting} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 border border-white/5">
                      {isSubmitting ? 'Memproses...' : 'Publish'}
                    </button>
                </div>
              </form>
            </section>

            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-gray-400 mb-4 pb-3 border-b border-white/5">Arsip Pengumuman</h3>
              <div className="flex flex-col gap-3">
                {annList.length === 0 ? <p className="text-[11px] text-gray-600 text-center py-4">Belum ada pengumuman.</p> : annList.map(ann => (
                  <div key={ann.id} className="flex gap-4 items-center bg-[#111] p-3 rounded-xl border border-white/5">
                        {ann.image_url ? (
                          <div className="w-16 h-12 shrink-0 rounded-md overflow-hidden bg-black/50 border border-white/5">
                            <img src={ann.image_url} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-12 shrink-0 rounded-md bg-white/5 border border-white/5 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[12px] font-semibold text-gray-200 truncate">{ann.title}</span>
                          <span className="text-[9px] text-gray-500 truncate mt-0.5">{ann.date}</span>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB: IKLAN ================= */}
        {activeTab === 'iklan' && (
          <div className="animate-fade-in flex flex-col gap-6">
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-gray-200">Registrasi Sponsor</h2>
                <p className="text-[11px] text-gray-500 mt-1">Tambahkan banner promosi.</p>
              </div>
              <form onSubmit={handleAddAd} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Judul Kampanye</label>
                  <input required value={adTitle} onChange={(e) => setAdTitle(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="Contoh: Baca di Komiku.id" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Deskripsi Singkat</label>
                  <input value={adDesc} onChange={(e) => setAdDesc(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="Update Setiap Minggu..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">URL Tujuan</label>
                  <input required type="url" value={adLink} onChange={(e) => setAdLink(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="https://..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Banner Gambar</label>
                  <input required type="file" accept="image/*" ref={adFileRef} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-white/10 file:text-white file:text-[11px]" />
                </div>
                <div className="flex justify-end mt-2">
                    <button type="submit" disabled={isSubmitting} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 border border-white/5">
                      {isSubmitting ? 'Mengunggah...' : 'Simpan'}
                    </button>
                </div>
              </form>
            </section>

            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-gray-400 mb-4 pb-3 border-b border-white/5">Sponsor Aktif</h3>
              <div className="flex flex-col gap-3">
                {adsList.length === 0 ? <p className="text-[11px] text-gray-600 text-center py-4">Belum ada iklan.</p> : adsList.map(ad => (
                  <div key={ad.id} className="flex gap-4 items-center bg-[#111] p-3 rounded-xl border border-white/5">
                        <div className="w-16 h-12 shrink-0 rounded-md overflow-hidden bg-black/50 border border-white/5">
                          <img src={ad.image_url} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[12px] font-semibold text-gray-200 truncate">{ad.title}</span>
                          <a href={ad.link} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400/80 hover:text-blue-400 truncate mt-0.5">{ad.link}</a>
                        </div>
                        <button onClick={() => handleDeleteAd(ad.id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= TAB: ROLES & USERS ================= */}
        {activeTab === 'role' && (
          <div className="animate-fade-in flex flex-col gap-6">
            
            {/* 1. ASSIGN ROLE KE USER */}
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl border-l-2 border-l-red-900">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-gray-200">Angkat Pengurus (Assign Role)</h2>
                <p className="text-[11px] text-gray-500 mt-1">Berikan otoritas khusus kepada pengguna terdaftar.</p>
              </div>
              
              <form onSubmit={handleAssignRole} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Username Target</label>
                  <input required value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="Masukkan username persis..." />
                </div>
                
                <div className="flex gap-3 items-end">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-400">Pilih Otoritas</label>
                    <select value={selectedRoleToAssign} onChange={(e) => setSelectedRoleToAssign(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-red-900/50 appearance-none">
                      {rolesList.map(r => (
                        <option key={r.name} value={r.name}>{r.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button type="submit" disabled={isSubmitting} className="h-[46px] px-6 bg-red-900/80 hover:bg-red-800 text-white font-bold rounded-lg transition-all text-[12px] border border-red-700/50">
                    Eksekusi
                  </button>
                </div>
              </form>
            </section>

            {/* 2. DAFTAR PENGGUNA BEROTORITAS */}
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-gray-400 mb-4 pb-3 border-b border-white/5">Susunan Pengurus Aktif</h3>
              <div className="flex flex-col gap-2">
                {usersWithRoles.length === 0 ? <p className="text-[11px] text-gray-600 text-center py-4">Belum ada staf / pengurus.</p> : usersWithRoles.map(u => {
                  const uRoleLower = u.role?.toLowerCase() || '';
                  const roleObj = rolesList.find(r => r.name.toLowerCase() === uRoleLower);
                  // Jika owner, force warna gold
                  const color = uRoleLower === 'owner' ? '#ffcc00' : (roleObj ? roleObj.color : '#888');
                  
                  return (
                    <div key={u.id} className={`flex justify-between items-center bg-[#111] p-3 rounded-lg border ${uRoleLower === 'owner' ? 'border-yellow-600/30' : 'border-white/5'}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">{u.username || 'Anonim'}</span>
                          {u.id === currentUserId && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-gray-400">(Kamu)</span>}
                        </div>
                        <div className="flex mt-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-sm shadow-sm" style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                      
                      {/* Tombol Demote: Sembunyikan jika dia OWNER dan yg login bukan OWNER */}
                      {(uRoleLower !== 'owner' || isOwner) && (
                        <button onClick={() => handleRemoveUserRole(u.id, u.role)} className="text-[10px] text-gray-400 hover:text-red-400 font-medium px-3 py-1.5 rounded-md hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-900/30">Demote</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. BUAT TIPE ROLE BARU */}
            <section className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-gray-200">Konfigurasi Label Peran (Tag)</h2>
                <p className="text-[11px] text-gray-500 mt-1">Buat jenis peran baru beserta warnanya.</p>
              </div>
              <form onSubmit={handleAddRole} className="flex gap-3 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400">Nama Role Baru</label>
                  <input required value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-red-900/50" placeholder="moderator, uploader, dll" />
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-[11px] font-semibold text-gray-400 text-center">Warna</label>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-[#111]">
                    <input type="color" value={roleColor} onChange={(e) => setRoleColor(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all text-[12px] border border-white/5">
                  Save
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {rolesList.map(r => (
                  <div key={r.name} className={`flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-md border bg-[#111] ${r.name.toLowerCase() === 'owner' ? 'border-yellow-600/30' : 'border-white/5'}`}>
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: r.color }}></span>
                    <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider">{r.name}</span>
                    
                    {/* Cegah Hapus Role Owner */}
                    {r.name.toLowerCase() !== 'owner' ? (
                      <button onClick={() => handleDeleteRole(r.name)} className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white/5 ml-1 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    ) : (
                      <span className="w-5 ml-1"></span> // Spacer aja
                    )}
                  </div>
                ))}
              </div>
            </section>
            
          </div>
        )}

      </div>
    </div>
  );
                    }
