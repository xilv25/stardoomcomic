'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function HomeHeader({ activeTab }: { activeTab: string }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Efek Hide/Show Header saat di-scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // Sembunyi kalau scroll ke bawah
      } else {
        setIsVisible(true);  // Muncul kalau scroll ke atas
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Tutup suggest kalau klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // LOGIKA PENCARIAN SUPER CEPAT (Delay dipotong jadi 150ms)
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

    const timer = setTimeout(fetchSuggestions, 150); // <-- Dipercepat disini
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
    <header className={`fixed top-0 w-full max-w-xl left-1/2 -translate-x-1/2 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {/* Background Gradient Transparan biar teks & kotak pencarian tetap terbaca di atas gambar */}
      <div className="bg-gradient-to-b from-[#050505]/90 via-[#050505]/60 to-transparent pt-4 pb-6 px-4 flex flex-col gap-4">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-900/80 border border-red-800/50 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(127,29,29,0.4)]">S</div>
            <h1 className="text-xl font-extrabold tracking-widest text-white drop-shadow-md">
              SDC<span className="text-red-900">.</span>
            </h1>
          </div>
          <Link href="/profile" className="w-8 h-8 rounded-full bg-black/40 overflow-hidden border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors">
             <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mix-blend-screen opacity-90" loading="lazy" />
          </Link>
        </div>
        
        <div className="relative w-full" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Cari komik, manhwa, manga..." 
              className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-red-900 shadow-inner"
            />
          </form>

          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0a0a0a]/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              {suggestions.map((item) => (
                <div 
                  key={item.slug}
                  onClick={() => {
                    setQuery(item.title);
                    setIsOpen(false);
                    router.push(`/?type=${activeTab}&q=${encodeURIComponent(item.title)}&page=1`);
                  }}
                  className="flex items-center gap-3 p-2.5 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-none transition-colors"
                >
                  <img src={item.thumbnail_url || item.cover} alt={item.title} className="w-10 h-12 object-cover rounded-lg grayscale-[20%]" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-gray-200 truncate">{item.title}</span>
                    <span className="text-[10px] text-gray-500">{item.type || 'Manga'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
          }
