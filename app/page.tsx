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
  const isSearching = !!searchQuery; // Deteksi apakah user sedang mencari

  let daftarKomik: any[] = [];
  let carouselMangas: any[] = [];
  let favMangas: any[] = [];
  let apiError = false;
  let totalPages = 1;
  const ITEMS_PER_PAGE = 10;

  try {
    const headers = { "Makota-API": process.env.MAKOTA_API_TOKEN as string };
    
    // 1. JIKA TIDAK MENCARI: Ambil data Popular untuk Carousel & Favorit
    if (!isSearching && currentPage === 1) {
      const resPopular = await fetch(`https://api.makota.asia/api/v1/manga/popular?limit=8`, {
        headers, next: { revalidate: 3600 } // Cache 1 jam agar ringan
      });
      const popData = await resPopular.json();
      if (popData.ok && popData.data.results) {
        // 5 Teratas untuk Carousel Promosi
        carouselMangas = popData.data.results.slice(0, 5);
        // 3 Berikutnya untuk Favorit / Rekomendasi
        favMangas = popData.data.results.slice(5, 8);
      }
    }

    // 2. AMBIL DATA DAFTAR KOMIK BAWAH (Update / Search)
    const urlParams = new URLSearchParams();
    let mangas = [];

    if (isSearching) {
      // API PENCARIAN
      urlParams.append('limit', ITEMS_PER_PAGE.toString());
      urlParams.append('page', currentPage.toString());
      if (activeTab !== 'semua') urlParams.append('type', activeTab);
      urlParams.append('q', searchQuery);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/search?${urlParams.toString()}`, {
        headers, cache: 'no-store' 
      });
      const listData = await resList.json();

      if (listData.ok && listData.data.results) {
        mangas = listData.data.results;
        totalPages = Math.ceil((listData.data.total || 0) / ITEMS_PER_PAGE);
      }
    } else {
      // API UPDATE TERBARU
      urlParams.append('limit', '50');
      if (activeTab !== 'semua') urlParams.append('type', activeTab);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/latest?${urlParams.toString()}`, {
        headers, next: { revalidate: 60 } 
      });
      const listData = await resList.json();

      if (listData.ok && listData.data.results) {
        const allMangas = listData.data.results;
        totalPages = Math.ceil(allMangas.length / ITEMS_PER_PAGE);
        mangas = allMangas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      }
    }

    // 3. TARIK DETAIL CHAPTER KHUSUS UNTUK DAFTAR BAWAH SAJA
    const detailedMangas = await Promise.all(
      mangas.map(async (manga: any) => {
        const resDetail = await fetch(`https://api.makota.asia/api/v1/manga/${manga.slug}`, {
          headers, next: { revalidate: 60 }
        });
        const detailData = await resDetail.json();
        
        if (detailData.ok) {
          const detail = detailData.data.manga;
          let flag = "🇯🇵"; 
          if (detail.type.toLowerCase() === "manhwa") flag = "🇰🇷";
          if (detail.type.toLowerCase() === "manhua") flag = "🇨🇳";
          
          let chapterList = [...detail.chapters];
          const firstChNum = parseInt(chapterList[0]?.name.match(/\d+/)?.[0] || "0");
          const lastChNum = parseInt(chapterList[chapterList.length - 1]?.name.match(/\d+/)?.[0] || "0");
          if (firstChNum < lastChNum) chapterList.reverse();

          return {
            title: detail.title,
            slug: detail.slug,
            cover: detail.thumbnail_url,
            type: detail.type,
            flag: flag,
            isUp: true,
            chapters: chapterList.slice(0, 3).map((ch: any) => ({
              name: ch.name,
              slug: ch.slug,
              time: "Baru" 
            }))
          };
        }
        return null;
      })
    );
    daftarKomik = detailedMangas.filter(Boolean);
  } catch (error) {
    apiError = true;
  }

  // LOGIKA PAGINASI 1 2 3 4 5
  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  if (endPage - startPage + 1 < MAX_PAGES) startPage = Math.max(1, endPage - MAX_PAGES + 1);
  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  const baseQuery = `?type=${activeTab}${searchQuery ? '&q='+searchQuery : ''}`;

  // DATA PENGUMUMAN DUMMY (ADMIN)
  const announcements = [
    { title: "Premium Sekarang Cuma Rp 12.500!!!", date: "16 November 2025", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Promo" },
    { title: "Pengumuman Rekrutmen Translator & Typesetter", date: "03 August 2025", img: "https://api.dicebear.com/7.x/notionists/svg?seed=Recruit" }
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50 overflow-x-hidden">
      
      {/* HEADER TOP BAR */}
      <header className="sticky top-0 z-50 bg-[#050505]/85 backdrop-blur-xl px-4 py-4 flex flex-col gap-4 border-b border-white/5 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-900/80 border border-red-500/30 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(153,27,27,0.4)]">S</div>
            <h1 className="text-xl font-extrabold tracking-widest text-white">
              SDC<span className="text-gray-500">.</span>
            </h1>
          </div>
          
          {/* TOMBOL PROFILE (Berfungsi ke /profile) */}
          <Link prefetch={false} href="/profile" className="w-8 h-8 rounded-full bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors">
             <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mix-blend-screen opacity-90" loading="lazy" />
          </Link>
        </div>
        
        <SearchBar initialQuery={searchQuery} activeTab={activeTab} />
      </header>

      {/* TAMPILKAN EXTRA SECTION HANYA JIKA TIDAK MENCARI DAN DI HALAMAN 1 */}
      {!isSearching && currentPage === 1 && (
        <div className="px-4 mt-5 max-w-xl mx-auto flex flex-col gap-8">
          
          {/* SECTION 1: PENGUMUMAN ADMIN */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-lg font-bold">Pengumuman</h2>
              <span className="text-xs text-gray-400">Semua</span>
            </div>
            <div className="flex flex-col gap-3">
              {announcements.map((ann, i) => (
                <div key={i} className="flex gap-3 bg-[#18181b] border border-white/5 p-3 rounded-2xl items-center shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-red-900/20 shrink-0 overflow-hidden border border-red-500/20">
                    <img src={ann.img} alt="icon" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-200 line-clamp-1">{ann.title}</span>
                    <span className="text-[10px] text-gray-500 mt-1">{ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: CAROUSEL PROMO KOMIK BARU */}
          {carouselMangas.length > 0 && (
            <section>
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4 -mx-4 px-4">
                {carouselMangas.map((manga) => (
                  <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="relative snap-center shrink-0 w-full h-[200px] sm:h-[250px] rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                    <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col">
                      <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max mb-1">PROMO</span>
                      <h3 className="text-lg font-extrabold text-white line-clamp-1 drop-shadow-md">{manga.title}</h3>
                      <span className="text-xs text-gray-300 capitalize">{manga.type} • ⭐ {manga.rating || 'New'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: 3 FAVORIT / REKOMENDASI */}
          {favMangas.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold">Rekomendasi</h2>
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">^</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {favMangas.map((manga, idx) => {
                  let flag = "🇯🇵"; 
                  if (manga.type.toLowerCase() === "manhwa") flag = "🇰🇷";
                  if (manga.type.toLowerCase() === "manhua") flag = "🇨🇳";

                  return (
                    <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="flex flex-col gap-1.5 group">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/5 bg-[#18181b]">
                        <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute top-1 left-1 bg-[#18181b]/80 backdrop-blur-md border border-white/10 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="text-red-400">#{idx + 1}</span>
                        </div>
                        <div className="absolute top-1 right-1 bg-white/90 text-xs px-1 rounded shadow">{flag}</div>
                      </div>
                      <h3 className="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                        {manga.title}
                      </h3>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      )}

      {/* SECTION 4: DAFTAR UPDATE SEMUA KOMIK */}
      <div className="px-4 mt-8 max-w-xl mx-auto">
        
        <h2 className="text-lg font-bold mb-4">{isSearching ? 'Hasil Pencarian' : 'Update Terbaru'}</h2>

        {/* FILTER TAB */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Link prefetch={false} href={`/?type=semua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'semua' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#18181b] border border-white/10 text-gray-400 hover:text-white backdrop-blur-sm'}`}>Semua</Link>
          <Link prefetch={false} href={`/?type=manhwa${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhwa' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#18181b] border border-white/10 text-gray-400 hover:text-white backdrop-blur-sm'}`}>Manhwa</Link>
          <Link prefetch={false} href={`/?type=manga${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manga' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#18181b] border border-white/10 text-gray-400 hover:text-white backdrop-blur-sm'}`}>Manga</Link>
          <Link prefetch={false} href={`/?type=manhua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhua' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-[#18181b] border border-white/10 text-gray-400 hover:text-white backdrop-blur-sm'}`}>Manhua</Link>
        </div>

        {apiError && <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-center text-sm text-red-400">Gagal mengambil data dari Makota API.</div>}
        {!apiError && daftarKomik.length === 0 && <div className="text-center text-gray-500 text-sm mt-10">{searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Sedang memuat komik..."}</div>}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {daftarKomik.map((komik, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <Link prefetch={false} href={`/manga/${komik.slug}`} className="relative rounded-lg overflow-hidden group aspect-[2/3] border border-white/5 bg-white/5">
                <img src={komik.cover} alt={komik.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-xs px-1.5 py-0.5 rounded shadow flex gap-1 items-center">
                  <span className="text-[10px] text-gray-300 font-bold pr-1 border-r border-white/20">{komik.type}</span>
                  <span>{komik.flag}</span>
                </div>
              </Link>
              
              <div className="mt-1">
                <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2 leading-tight">
                  {komik.isUp && <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded mr-1.5 align-middle">UP</span>}
                  {komik.title}
                </h3>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                {komik.chapters.map((ch: any, cIdx: number) => (
                  <Link prefetch={false} key={cIdx} href={`/baca/${komik.slug}/${ch.slug}`} className="flex justify-between items-center bg-white/5 backdrop-blur-sm hover:bg-red-900/30 text-gray-300 hover:text-white text-[11px] font-medium px-2.5 py-2 rounded transition-all border border-white/5">
                    <span className="truncate pr-2">{ch.name}</span>
                    <span className="text-gray-500 text-[9px] whitespace-nowrap">{ch.time}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINASI BAWAH */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            {currentPage > 1 && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage - 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-all text-gray-300 backdrop-blur-sm">{"<"}</Link>
            )}
            
            {paginationArray.map(pageNum => (
              <Link prefetch={false} key={pageNum} href={`${baseQuery}&page=${pageNum}`} className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all backdrop-blur-sm ${currentPage === pageNum ? 'bg-red-700 text-white shadow-[0_0_10px_rgba(153,27,27,0.5)] border border-red-500' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                {pageNum}
              </Link>
            ))}

            {currentPage < totalPages && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-all text-gray-300 backdrop-blur-sm">{">"}</Link>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV BAR (SEMUA LINK SUDAH TERSAMBUNG) */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/85 backdrop-blur-xl border-t border-white/10 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.8)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-red-500 pb-2">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 mix-blend-screen" style={{ filter: 'drop-shadow(0 0 5px rgba(220,38,38,0.5)) sepia(1) hue-rotate(320deg) saturate(500%)' }} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-500 hover:text-gray-300 pb-2 transition-colors">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mb-1 opacity-60 mix-blend-screen" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-gray-500 hover:text-gray-300 pb-2 transition-colors">
          <svg className="w-5 h-5 mb-1 opacity-60 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-500 hover:text-gray-300 pb-2 transition-colors">
          <img src="/ic-profile.jpg" alt="Profile" className="w-5 h-5 mb-1 opacity-60 mix-blend-screen" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
        }
                  
