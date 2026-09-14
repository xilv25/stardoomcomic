"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SearchBar({ initialQuery, activeTab }: { initialQuery: string, activeTab: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
        const recs = await res.json();
        setResults(recs);
      } catch (e) {
        setResults([]);
      }
    };
    
    const timeout = setTimeout(fetchSearch, 400);
    return () => clearTimeout(timeout);
  }, [query, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query) {
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
    } else {
      router.push(`/?type=${activeTab}&page=1`);
    }
  };

  return (
    <div className="relative w-full z-[70]">
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Cari manhwa, manga..." 
          className="w-full bg-[#18181b] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
        />
        <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {results.map((manga: any) => (
            <Link 
              key={manga.slug} 
              href={`/manga/${manga.slug}`} 
              prefetch={false} // MATIKAN PREFETCH (Penting!)
              onClick={() => setShowDropdown(false)} 
              className="flex items-center gap-3 p-3 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
            >
              <img src={manga.thumbnail_url} alt={manga.title} className="w-10 h-14 object-cover rounded shadow" loading="lazy" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200 line-clamp-1">{manga.title}</span>
                <span className="text-[10px] text-red-400 capitalize mt-0.5">{manga.type} • {manga.latest_chapter}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
