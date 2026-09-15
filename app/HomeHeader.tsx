'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomeHeader({ activeTab = 'semua' }: { activeTab?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
        // Ambil maksimal 3 komik (limit=3) agar ringan dan cepat
        const res = await fetch(`https://api.makota.asia/api/v1/manga/search?q=${encodeURIComponent(query)}&limit=3`);
        const data = await res.json();
        
        if (data.ok && data.data?.results) {
          setSuggestions(data.data.results.slice(0, 3));
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        setSuggestions([]);
      }
    }, 400); // Muncul cepat dalam 0.4 detik setelah mengetik
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
    }
  };

  return (
    <header className="absolute top-0 left-0 w-full z-50 px-4 pt-6 pb-6 bg-gradient-to-b from-[#050505] via-[#050505]/70 to-transparent pointer-events-none">
      
      {/* Container agar isi header bisa diklik */}
      <div className="pointer-events-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-900 rounded-lg flex items-center justify-center font-black text-white shadow-lg">S</div>
            <span className="font-extrabold text-lg tracking-widest text-white">SDC<span className="text-red-600">.</span></span>
          </div>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden hover:border-red-900 transition-colors">
            <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 opacity-80 mix-blend-screen" />
          </Link>
        </div>
        
        <div className="relative w-full">
          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim()) setShowDropdown(true); }}
              placeholder="Cari komik, manhwa, manga..." 
              className="w-full bg-[#111]/80 backdrop-blur-md border border-white/10 text-white text-xs px-5 py-4 rounded-full focus:outline-none focus:border-red-900/50 focus:bg-black/80 transition-all shadow-xl"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </form>

          {/* DROPDOWN LIVE SEARCH */}
          {showDropdown && (
            <div className="absolute top-full left-0 w-full mt-3 bg-[#111] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 flex flex-col">
              {suggestions.length > 0 ? (
                suggestions.map((item: any) => (
                  <Link 
                    key={item.slug} 
                    href={`/manga/${item.slug}`} 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <img src={item.thumbnail_url} alt={item.title} className="w-10 h-14 object-cover rounded bg-black shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-gray-200 truncate">{item.title}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 capitalize">{item.type} • {item.latest_chapter}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5 text-center text-xs text-gray-500">Tidak ada hasil ditemukan.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
