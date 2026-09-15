import Link from 'next/link';

export default async function ExplorePage() {
  let popularMangas: any[] = [];
  let apiError = false;

  const MAKOTA_TOKEN = process.env.MAKOTA_API_TOKEN as string;

  try {
    // Mengambil data Manga Populer dari Makota API
    const res = await fetch(`https://api.makota.asia/api/v1/manga/popular?limit=16`, {
      headers: { "Makota-API": MAKOTA_TOKEN },
      next: { revalidate: 3600 } // Cache 1 jam agar loading halaman super cepat
    });
    
    const data = await res.json();
    if (data.ok && data.data?.results) {
      popularMangas = data.data.results;
    }
  } catch (error) {
    apiError = true;
    console.error("Gagal mengambil data popular manga", error);
  }

  // Format data komik
  const daftarPopuler = popularMangas.map((manga: any) => {
    let flag = "🇯🇵"; 
    const type = manga.type?.toLowerCase() || 'manga';
    if (type.includes("manhwa")) flag = "🇰🇷";
    if (type.includes("manhua")) flag = "🇨🇳";

    return {
      title: manga.title,
      slug: manga.slug,
      cover: manga.thumbnail_url || manga.cover,
      type: manga.type || 'Manga',
      flag: flag,
      rating: manga.rating || "N/A",
      latest_chapter: manga.latest_chapter || "Baru"
    };
  });

  // Kumpulan Genre Populer
  const GENRES = [
    { name: "Action", emoji: "⚔️" },
    { name: "Romance", emoji: "💕" },
    { name: "Fantasy", emoji: "🧙‍♂️" },
    { name: "Drama", emoji: "🎭" },
    { name: "Comedy", emoji: "😂" },
    { name: "Sci-Fi", emoji: "🚀" },
    { name: "Horror", emoji: "👻" },
    { name: "Isekai", emoji: "✨" },
    { name: "School", emoji: "🏫" },
    { name: "Thriller", emoji: "🔪" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans overflow-x-hidden relative selection:bg-red-900/50">
      
      {/* HEADER EKSPLOR */}
      <header className="sticky top-0 z-40 px-4 pt-6 pb-4 bg-gradient-to-b from-[#050505] via-[#050505]/90 to-[#050505]/60 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
        <h1 className="text-xl font-extrabold tracking-widest text-white uppercase flex items-center gap-2">
          <img src="/ic-compas.jpg" alt="Explore" className="w-6 h-6 mix-blend-screen opacity-80" />
          Explore
        </h1>
        <Link href="/" className="w-9 h-9 rounded-full bg-[#111] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </Link>
      </header>

      <div className="px-4 max-w-xl mx-auto mt-6">
        
        {/* SECTION 1: JELAJAHI GENRE */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-200 mb-4 uppercase tracking-wider">Jelajahi Genre</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4">
            {GENRES.map((genre, idx) => (
              <Link 
                key={idx} 
                prefetch={false}
                // Jika kamu belum punya page filter genre, untuk sementara kita arahkan ke pencarian home dengan keyword nama genrenya
                href={`/?q=${genre.name}&type=semua&page=1`} 
                className="snap-center shrink-0 flex items-center gap-2 bg-[#111] hover:bg-white/10 border border-white/5 px-5 py-3 rounded-2xl transition-colors shadow-sm"
              >
                <span className="text-lg">{genre.emoji}</span>
                <span className="text-xs font-bold text-gray-300">{genre.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* SECTION 2: TRENDING & TERPOPULER */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <span className="text-red-500 text-lg">🔥</span> Sedang Tren
            </h2>
          </div>

          {apiError && (
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-center text-sm text-red-800 mb-6">
              Gagal mengambil data komik populer.
            </div>
          )}

          {!apiError && daftarPopuler.length === 0 && (
            <div className="text-center text-gray-600 text-sm my-10">Sedang memuat komik...</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {daftarPopuler.map((komik, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Link prefetch={false} href={`/manga/${komik.slug}`} className="relative rounded-xl overflow-hidden group aspect-[2/3] border border-white/5 bg-[#111] shadow-lg">
                  <img src={komik.cover} alt={komik.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80"></div>
                  
                  {/* BADGE RATING BINTANG */}
                  {komik.rating !== "N/A" && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <span className="text-yellow-400 text-xs">★</span> {komik.rating}
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 bg-[#050505]/80 backdrop-blur-md border border-white/5 text-[9px] px-1.5 py-0.5 rounded shadow flex gap-1 items-center">
                    <span className="text-gray-300 font-bold pr-1 border-r border-white/10">{komik.type}</span>
                    <span>{komik.flag}</span>
                  </div>
                </Link>
                
                <div className="mt-1 flex flex-col">
                  <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                    <span className="text-red-600 mr-1.5">#{idx + 1}</span>
                    {komik.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 mt-1 font-medium">{komik.latest_chapter}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* BOTTOM NAVIGATION (Aktif di Explore) */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.9)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        {/* TOMBOL EXPLORE AKTIF (Nyala Merah) */}
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
