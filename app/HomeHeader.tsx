'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchSearchSuggest } from './actions';
import { supabase } from './utils/supabase';

export default function HomeHeader({ activeTab = 'semua' }: { activeTab?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // State untuk menyimpan Foto Profile User
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Ambil Foto Profile User dari Supabase secara menyeluruh
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;
          
          // Cek 1: Coba ambil dari User Metadata (Kalau pakai fungsi Auth.update)
          let foto = session.user.user_metadata?.avatar_url;
          
          // Cek 2: Coba ambil dari tabel database (Jika disave terpisah)
          if (!foto) {
            const { data: profile } = await supabase
              .from('profiles') // <-- UBAH 'profiles' JIKA NAMA TABELMU BERBEDA (Misal: 'users')
              .select('avatar_url') // <-- UBAH JIKA NAMA KOLOMMU BERBEDA
              .eq('id', userId)
              .maybeSingle();
              
            if (profile?.avatar_url) {
              foto = profile.avatar_url;
            }
          }

          if (foto) setAvatarUrl(foto);
        }
      } catch (error) {
        console.error("Gagal load profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // 2. Logika Search Suggest (Debounce)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      const data = await fetchSearchSuggest(query);
      
      if (data?.ok && data.data?.results) {
        setSuggestions(data.data.results.slice(0, 3));
      } else {
        setSuggestions([]);
      }
      setIsSearching(false);
    }, 400); 
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
    }
  };

  return (
    <header className="absolute top-0 left-0 w-full z-50 px-4 pt-4 pb-6 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
      
      <div className="pointer-events-auto">
        
        {/* BAGIAN ATAS: Logo & Profile Asli User */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-900 rounded-lg flex items-center justify-center font-black text-white shadow-lg">S</div>
            <span className="font-extrabold text-lg tracking-widest text-white">SDC<span className="text-red-600">.</span></span>
          </div>
          
          <Link href="/profile" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden hover:border-red-900 transition-colors shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 opacity-80 mix-blend-screen" />
            )}
          </Link>
        </div>
        
        <div className="relative w-full">
          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim()) setShowDropdown(true); }}
              placeholder="Cari komik, manhwa, manga..." 
              className="w-full bg-white/5 backdrop-blur-lg border border-red-900/50 text-white text-[13px] font-medium pl-10 pr-12 py-3.5 rounded-2xl focus:outline-none focus:border-red-500/80 focus:bg-white/10 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.3)] placeholder:text-gray-300"
            />
            
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </form>

          {showDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-50 flex flex-col animate-fade-in">
              {isSearching ? (
                <div className="p-5 text-center text-xs text-gray-300 font-medium">Mencari...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item: any) => (
                  <Link 
                    key={item.slug} 
                    href={`/manga/${item.slug}`} 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-4 p-3 border-b border-white/5 hover:bg-white/10 transition-all"
                  >
                    <img src={item.thumbnail_url} alt={item.title} className="w-12 h-16 object-cover rounded-lg bg-black shrink-0 shadow-md border border-white/5" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[13px] font-extrabold text-white truncate mb-1">{item.title}</span>
                      <span className="text-[11px] font-medium truncate text-gray-300">
                        <span className="text-red-400 capitalize">{item.type || 'Manga'}</span> • {item.latest_chapter || 'Chapter ?'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5 text-center text-xs text-gray-400">Tidak ada hasil ditemukan.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
