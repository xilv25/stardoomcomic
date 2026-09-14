'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function SearchBar({ activeTab }: { activeTab: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length > 1) {
        try {
          const res = await fetch(`https://api.makota.asia/api/v1/manga/search?q=${encodeURIComponent(query)}&limit=5`);
          const data = await res.json();
          if (data.ok && data.data?.results) {
            setSuggestions(data.data.results);
            setIsOpen(true);
          }
        } catch (e) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearchSubmit}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Cari komik, manhwa, manga..." 
          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 shadow-inner"
        />
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          {suggestions.map((item) => (
            <div 
              key={item.slug}
              onClick={() => {
                setQuery(item.title);
                setIsOpen(false);
                router.push(`/?type=${activeTab}&q=${encodeURIComponent(item.title)}&page=1`);
              }}
              className="flex items-center gap-3 p-2.5 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors"
            >
              <img src={item.thumbnail_url || item.cover} alt={item.title} className="w-10 h-12 object-cover rounded-lg" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-gray-200 truncate">{item.title}</span>
                <span className="text-[10px] text-gray-400">{item.type || 'Manga'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
