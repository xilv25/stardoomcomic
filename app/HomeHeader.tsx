'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchSearchSuggest } from './actions'; // Memanggil fungsi dari server

export default function HomeHeader({ activeTab = 'semua' }: { activeTab?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
      setIsSearching(true);
      
      // Ambil data lewat server secara aman & cepat (maksimal 3)
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
    <header className="absolute top-0 left-0 w-full z-50 px-4 pt-4 pb-6 bg-gradient-to-b from-[#050505] via-[#050505]/70 to-transparent pointer-events-none">
      
      <div className="pointer-events-auto">
        <div className="flex justify-between items-center mb-6">
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
            {/* Ikon Kaca Pembesar (Kiri) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            
            {/* Input Search (Border merah gelap) */}
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim()) setShowDropdown(true); }}
              placeholder="solo" 
              className="w-full bg-[#0a0a0a] border border-red-900/40 text-white text-[13px] font-medium pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-red-700/60 focus:bg-[#111] transition-all shadow-xl"
            />
          </form>

          {/* DROPDOWN LIVE SEARCH (GLASSMORPHISM) */}
          {showDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden z-50 flex flex-col">
              {isSearching ? (
                <div className="p-5 text-center text-xs text-gray-400">Mencari...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item: any) => (
                  <Link 
                    key={item.slug} 
                    href={`/manga/${item.slug}`} 
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-4 p-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <img src={item.thumbnail_url} alt={item.title} className="w-12 h-16 object-cover rounded-lg bg-black shrink-0 shadow-md border border-white/5" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[13px] font-extrabold text-white truncate mb-1">{item.title}</span>
                      <span className="text-[11px] font-medium truncate">
                        <span className="text-red-400 capitalize">{item.type || 'Manga'}</span> 
                        <span className="text-gray-500"> • {item.latest_chapter || 'Chapter ?'}</span>
                      </span>
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
