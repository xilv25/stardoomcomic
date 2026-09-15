'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchMangasByGenre, fetchPopularMangas } from './actions'; // Import 2 fungsi dari server

export default function ExplorePage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Default true agar langsung muncul teks loading

  const GENRES = [
    "Action", "Romance", "Fantasy", "Drama", "Comedy", 
    "Sci-Fi", "Horror", "Isekai", "School", "Thriller", "Adventure", "Shounen"
  ];

  // Load awal: Ambil komik populer (Sedang Tren) dengan aman dari Server Action
  useEffect(() => {
    const loadPopular = async () => {
      setLoading(true);
      try {
        const results = await fetchPopularMangas();
        setMangas(results);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    loadPopular();
  }, []);

  // Handle klik genre
  const handleGenreClick = async (genre: string) => {
    if (selectedGenre === genre) {
      // Kalau diklik dua kali, reset ke populer awal
      setSelectedGenre(null);
      setLoading(true);
      const results = await fetchPopularMangas();
      setMangas(results);
      setLoading(false);
      return;
    }

    setSelectedGenre(genre);
    setLoading(true);
    const results = await fetchMangasByGenre(genre);
    setMangas(results);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans overflow-x-hidden relative selection:bg-red-900/50">
      
      {/* HEADER EKSPLOR */}
      <header className="sticky top-0 z-40 px-4 pt-6 pb-4 bg-gradient-to-b from-[#050505] via-[#050505]/90 to-[#050505]/60 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-sm font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mix-blend-screen opacity-80" />
          Explore
        </h1>
        {/* Tombol Search di kanan atas dihubungkan ke homepage */}
        <Link href="/" className="w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </Link>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-6">
        
        {/* SECTION 1: PILIH GENRE */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kategori Genre</h2>
            {selectedGenre && (
              <button 
                onClick={() => handleGenreClick(selectedGenre)} 
                className="text-[10px] text-red-500 font-bold hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-2 pb-2 -mx-4 px-4">
            {GENRES.map((genre, idx) => {
              const isSelected = selectedGenre === genre;
              return (
                <button 
                  key={idx} 
                  onClick={() => handleGenreClick(genre)}
                  className={`snap-center shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected 
                      ? 'bg-red-900 text-white border-red-700 shadow-[0_0_12px_rgba(153,27,27,0.4)]' 
                      : 'bg-[#111] hover:bg-white/10 border-white/5 text-gray-300'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: DAFTAR KOMIK */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {selectedGenre ? `Genre: ${selectedGenre}` : 'Sedang Tren'}
            </h2>
            <span className="text-[10px] text-gray-600 font-bold">{mangas.length} Komik</span>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 text-xs my-20">Memuat daftar komik...</div>
          ) : mangas.length === 0 ? (
            <div className="text-center text-gray-600 text-xs my-20">Tidak ada komik ditemukan.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
              {mangas.map((manga: any, idx: number) => {
                let flag = "🇯🇵"; 
                const type = manga.type?.toLowerCase() || 'manga';
                if (type.includes("manhwa")) flag = "🇰🇷";
                if (type.includes("manhua")) flag = "🇨🇳";

                return (
                  <div key={manga.slug || idx} className="flex flex-col gap-2">
                    <Link prefetch={false} href={`/manga/${manga.slug}`} className="relative rounded-xl overflow-hidden group aspect-[2/3] border border-white/5 bg-[#111] shadow-lg">
                      <img src={manga.thumbnail_url || manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80"></div>
                      
                      {/* RATING BINTANG */}
                      {manga.rating && manga.rating !== "N/A" && (
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                          <span className="text-yellow-400">★</span> {manga.rating}
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 bg-[#050505]/80 backdrop-blur-md border border-white/5 text-[9px] px-1.5 py-0.5 rounded shadow flex gap-1 items-center">
                        <span className="text-gray-300 font-bold pr-1 border-r border-white/10 capitalize">{manga.type || 'Manga'}</span>
                        <span>{flag}</span>
                      </div>
                    </Link>
                    
                    <div className="mt-1 flex flex-col">
                      <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                        {manga.title}
                      </h3>
                      <span className="text-[10px] text-gray-500 mt-1 font-medium">{manga.latest_chapter || 'Ongoing'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.9)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-red-800 pb-2 transition-colors">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mb-1 mix-blend-screen" style={{ filter: 'drop-shadow(0 0 5px rgba(127,29,29,0.5)) sepia(1) hue-rotate(320deg) saturate(500%) brightness(0.7)' }} />
          <span className="text-[10px] font-bold">Explore</span>
        </Link>
        
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <svg className="w-5 h-5 mb-1 opacity-50 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
      }
