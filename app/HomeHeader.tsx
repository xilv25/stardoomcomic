'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

    setIsSearching(true);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Tunggu 0.5 detik setelah user berhenti mengetik agar tidak spam API
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.makota.asia/api/v1/manga/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        if (data.ok && data.data?.results) {
          setSuggestions(data.data.results);
        }
      } catch (e) {
        console.error(e);
      }
      setIsSearching(false);
    }, 500); 
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
    }
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-4 flex flex-col gap-4 bg-[#050505]/90 backdrop-blur border-b border-white/5">
      <div className="flex justify-between items-center">
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
            className="w-full bg-[#111] border border-white/10 text-white text-xs px-4 py-3.5 rounded-2xl focus:outline-none focus:border-red-900/50 focus:bg-white/5 transition-all shadow-inner"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
        </form>

        {/* DROPDOWN LIVE SEARCH */}
        {showDropdown && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-gray-500">Mencari...</div>
            ) : suggestions.length > 0 ? (
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
                    <span className="text-[10px] text-gray-500 mt-0.5">{item.type} • {item.latest_chapter}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-500">Tidak ada hasil ditemukan.</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
