import Link from 'next/link';
import SearchBar from './SearchBar';

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string, type?: string, page?: string }> 
}) {
  const resolvedSearch = await searchParams;
  const searchQuery = resolvedSearch?.q || '';
  const activeTab = resolvedSearch?.type || 'semua';
  const currentPage = parseInt(resolvedSearch?.page || '1');
  const isSearching = !!searchQuery;

  let daftarKomik: any[] = [];
  let carouselMangas: any[] = [];
  let favMangas: any[] = [];
  let apiError = false;
  let totalPages = 1;
  const ITEMS_PER_PAGE = 8; // Dibatasi pas agar tidak overload

  try {
    const headers = { "Makota-API": process.env.MAKOTA_API_TOKEN as string };
    
    // 1. AMBIL DATA PREVIEW (Carousel & Rekomendasi)
    if (!isSearching && currentPage === 1) {
      const resPopular = await fetch(`https://api.makota.asia/api/v1/manga/popular?limit=8`, {
        headers, next: { revalidate: 3600 } 
      });
      const popData = await resPopular.json();
      if (popData.ok && popData.data?.results) {
        carouselMangas = popData.data.results.slice(0, 5);
        favMangas = popData.data.results.slice(5, 8);
      }
    }

    // 2. AMBIL DATA DAFTAR KOMIK BAWAH
    const urlParams = new URLSearchParams();
    if (isSearching) {
      urlParams.append('limit', ITEMS_PER_PAGE.toString());
      urlParams.append('page', currentPage.toString());
      if (activeTab !== 'semua') urlParams.append('type', activeTab);
      urlParams.append('q', searchQuery);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/search?${urlParams.toString()}`, {
        headers, cache: 'no-store' 
      });
      const listData = await resList.json();

      if (listData.ok && listData.data?.results) {
        daftarKomik = listData.data.results;
        totalPages = Math.ceil((listData.data.total || 0) / ITEMS_PER_PAGE);
      }
    } else {
      urlParams.append('limit', '30');
      if (activeTab !== 'semua') urlParams.append('type', activeTab);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/latest?${urlParams.toString()}`, {
        headers, next: { revalidate: 60 } 
      });
      const listData = await resList.json();

      if (listData.ok && listData.data?.results) {
        const allMangas = listData.data.results;
        totalPages = Math.ceil(allMangas.length / ITEMS_PER_PAGE);
        daftarKomik = allMangas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      }
    }
  } catch (error) {
    apiError = true;
  }

  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  if (endPage - startPage + 1 < MAX_PAGES) startPage = Math.max(1, endPage - MAX_PAGES + 1);
  startPage = Math.max(1, startPage);
  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  const baseQuery = `?type=${activeTab}${searchQuery ? '&q='+searchQuery : ''}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] px-4 py-4 flex flex-col gap-4 border-b border-white/5 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center font-bold text-white shadow">S</div>
            <h1 className="text-xl font-extrabold tracking-widest text-white">
              SDC<span className="text-gray-500">.</span>
            </h1>
          </div>
          <Link prefetch={false} href="/profile" className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          </Link>
        </div>
        <SearchBar initialQuery={searchQuery} activeTab={activeTab} />
      </header>

      {!isSearching && currentPage === 1 && (
        <div className="px-4 mt-5 max-w-xl mx-auto flex flex-col gap-8">
          
          {/* PENGUMUMAN ADMIN */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-lg font-bold">Pengumuman</h2>
              <span className="text-xs text-gray-400">Semua</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 bg-[#111] border border-white/5 p-3 rounded-2xl items-center shadow-md">
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-lg">📢</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-200 line-clamp-1">Premium Sekarang Cuma Rp 12.500!!!</span>
                  <span className="text-[10px] text-gray-500 mt-0.5">16 November 2025</span>
                </div>
              </div>
            </div>
          </section>

          {/* CAROUSEL PROMOSI */}
          {carouselMangas.length > 0 && (
            <section>
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-2 -mx-4 px-4">
                {carouselMangas.map((manga) => (
                  <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="relative snap-center shrink-0 w-[90%] sm:w-[80%] h-[200px] rounded-2xl overflow-hidden border border-white/5 bg-[#18181b] shadow-lg">
                    <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col">
                      <span className="bg-red-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max mb-1">PROMO</span>
                      <h3 className="text-lg font-extrabold text-white line-clamp-1">{manga.title}</h3>
                      <span className="text-xs text-gray-300 capitalize">{manga.type || 'Manga'} • ⭐ {manga.rating || 'New'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* REKOMENDASI 3 FAVORIT */}
          {favMangas.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold">Rekomendasi</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {favMangas.map((manga, idx) => {
                  let flag = "🇯🇵"; 
                  if (manga.type?.toLowerCase() === "manhwa") flag = "🇰🇷";
                  if (manga.type?.toLowerCase() === "manhua") flag = "🇨🇳";

                  return (
                    <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="flex flex-col gap-1.5 group">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/5 bg-[#111] shadow">
                        <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute top-1 left-1 bg-[#18181b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </div>
                        <div className="absolute top-1 right-1 bg-white/90 text-[10px] px-1 rounded text-black">{flag}</div>
                      </div>
                      <h3 className="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight">
                        {manga.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* DAFTAR UPDATE */}
      <div className="px-4 mt-8 max-w-xl mx-auto">
        <h2 className="text-lg font-bold mb-4">{isSearching ? 'Hasil Pencarian' : 'Update Terbaru'}</h2>

        {/* FILTER TAB */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Link prefetch={false} href={`/?type=semua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-colors ${activeTab === 'semua' ? 'bg-red-800 text-white' : 'bg-[#18181b] text-gray-400'}`}>Semua</Link>
          <Link prefetch={false} href={`/?type=manhwa${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-colors ${activeTab === 'manhwa' ? 'bg-red-800 text-white' : 'bg-[#18181b] text-gray-400'}`}>Manhwa</Link>
          <Link prefetch={false} href={`/?type=manga${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-colors ${activeTab === 'manga' ? 'bg-red-800 text-white' : 'bg-[#18181b] text-gray-400'}`}>Manga</Link>
          <Link prefetch={false} href={`/?type=manhua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-colors ${activeTab === 'manhua' ? 'bg-red-800 text-white' : 'bg-[#18181b] text-gray-400'}`}>Manhua</Link>
        </div>

        {apiError && <div className="p-4 bg-[#18181b] text-red-400 text-center text-sm rounded-lg">Gagal memuat API.</div>}
        {!apiError && daftarKomik.length === 0 && <div className="text-center text-gray-500 text-sm mt-10">Komik tidak ditemukan.</div>}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {daftarKomik.map((komik, idx) => {
            let flag = "🇯🇵"; 
            if (komik.type?.toLowerCase() === "manhwa") flag = "🇰🇷";
            if (komik.type?.toLowerCase() === "manhua") flag = "🇨🇳";

            return (
              <div key={idx} className="flex flex-col gap-2">
                <Link prefetch={false} href={`/manga/${komik.slug}`} className="relative rounded-lg overflow-hidden group aspect-[2/3] border border-white/5 bg-[#111]">
                  <img src={komik.thumbnail_url || komik.cover} alt={komik.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-1.5 py-0.5 rounded flex gap-1 items-center">
                    <span className="text-[10px] text-gray-300 font-bold pr-1 border-r border-white/20">{komik.type || 'Manga'}</span>
                    <span>{flag}</span>
                  </div>
                </Link>
                
                <div className="mt-1">
                  <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2 leading-tight">
                    <span className="bg-red-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded mr-1.5 align-middle">UP</span>
                    {komik.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINASI */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            {currentPage > 1 && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage - 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#18181b] text-xs text-gray-300">{"<"}</Link>
            )}
            {paginationArray.map(pageNum => (
              <Link prefetch={false} key={pageNum} href={`${baseQuery}&page=${pageNum}`} className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold ${currentPage === pageNum ? 'bg-red-800 text-white' : 'bg-[#18181b] text-gray-400'}`}>
                {pageNum}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#18181b] text-xs text-gray-300">{">"}</Link>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#0a0a0a] border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-red-500 pb-2">
          <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-500 pb-2">
          <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-gray-500 pb-2">
          <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-500 pb-2">
          <svg className="w-5 h-5 mb-1 opacity-80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
          }
          
