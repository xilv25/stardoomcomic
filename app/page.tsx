import Link from 'next/link';
import HomeHeader from './HomeHeader';

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
  const ITEMS_PER_PAGE = 10;

  const MAKOTA_TOKEN = process.env.MAKOTA_API_TOKEN as string;

  // =====================================================================
  // AREA KONTROL ADMIN (Data ini nantinya diganti pakai fetch dari Database)
  // =====================================================================
  const adminAnnouncements = [
    { id: 1, title: "Premium Sekarang Cuma Rp 12.500!!!", date: "16 November 2025" },
    { id: 2, title: "Pengumuman Rekrutmen Translator & Typesetter", date: "03 August 2025" }
  ];

  const adminSponsors = [
    { id: 1, title: "Sponsor 1", image: "https://api.dicebear.com/7.x/shapes/svg?seed=Ads1&backgroundColor=2a0a0a", link: "#" },
    { id: 2, title: "Sponsor 2", image: "https://api.dicebear.com/7.x/shapes/svg?seed=Ads2&backgroundColor=1a1a1a", link: "#" }
  ];
  // =====================================================================

  try {
    const headers = { "Makota-API": MAKOTA_TOKEN };
    
    // 1. DATA CAROUSEL (Hero) & REKOMENDASI
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

    // 2. DATA DAFTAR UTAMA
    const urlParams = new URLSearchParams();
    let mangas: any[] = [];

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
        mangas = listData.data.results;
        totalPages = Math.ceil((listData.data.total || 0) / ITEMS_PER_PAGE);
      }
    } else {
      urlParams.append('limit', '50');
      if (activeTab !== 'semua') urlParams.append('type', activeTab);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/latest?${urlParams.toString()}`, {
        headers, next: { revalidate: 60 } 
      });
      const listData = await resList.json();

      if (listData.ok && listData.data?.results) {
        const allMangas = listData.data.results;
        totalPages = Math.ceil(allMangas.length / ITEMS_PER_PAGE);
        mangas = allMangas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      }
    }

    // 3. AMBIL DETAIL CHAPTER
    const detailedMangas = await Promise.all(
      mangas.map(async (manga: any) => {
        try {
          const resDetail = await fetch(`https://api.makota.asia/api/v1/manga/${manga.slug}`, {
            headers, next: { revalidate: 60 }
          });
          const detailData = await resDetail.json();
          
          if (detailData.ok && detailData.data?.manga) {
            const detail = detailData.data.manga;
            let flag = "🇯🇵"; 
            if (detail.type?.toLowerCase() === "manhwa") flag = "🇰🇷";
            if (detail.type?.toLowerCase() === "manhua") flag = "🇨🇳";
            
            let chapterList = detail.chapters ? [...detail.chapters] : [];
            if (chapterList.length > 0) {
              const firstChNum = parseInt(chapterList[0]?.name.match(/\d+/)?.[0] || "0");
              const lastChNum = parseInt(chapterList[chapterList.length - 1]?.name.match(/\d+/)?.[0] || "0");
              if (firstChNum < lastChNum) chapterList.reverse();
            }

            return {
              title: detail.title || manga.title,
              slug: detail.slug || manga.slug,
              cover: detail.thumbnail_url || manga.thumbnail_url,
              type: detail.type || manga.type,
              flag: flag,
              isUp: true,
              chapters: chapterList.slice(0, 3).map((ch: any) => ({
                name: ch.name,
                slug: ch.slug,
                time: "Baru" 
              }))
            };
          }
        } catch (e) {
          // Skip if error
        }
        
        return {
          title: manga.title,
          slug: manga.slug,
          cover: manga.thumbnail_url || manga.cover,
          type: manga.type || 'Manga',
          flag: manga.type?.toLowerCase() === "manhwa" ? "🇰🇷" : manga.type?.toLowerCase() === "manhua" ? "🇨🇳" : "🇯🇵",
          isUp: false,
          chapters: []
        };
      })
    );
    daftarKomik = detailedMangas.filter(Boolean);
  } catch (error) {
    apiError = true;
  }

  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  if (endPage - startPage + 1 < MAX_PAGES) startPage = Math.max(1, endPage - MAX_PAGES + 1);
  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  const baseQuery = `?type=${activeTab}${searchQuery ? '&q='+searchQuery : ''}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50 overflow-x-hidden relative">
      
      {/* HEADER TRANSPARAN */}
      <HomeHeader activeTab={activeTab} />

      {/* SECTION 1: HERO CAROUSEL MANHWA (Background Atas) */}
      {!isSearching && currentPage === 1 && carouselMangas.length > 0 && (
        <section className="relative w-full h-[40vh] sm:h-[50vh]">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full">
            {carouselMangas.map((manga) => (
              <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="relative snap-center shrink-0 w-full h-full group">
                <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover grayscale-[15%]" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"></div>
                
                <div className="absolute bottom-6 left-4 right-4 flex flex-col">
                  <span className="bg-white/10 backdrop-blur border border-white/20 text-white text-[9px] font-extrabold px-2 py-0.5 rounded w-max mb-2">{manga.type || 'Manga'}</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-1">{manga.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* KONTEN BAWAH */}
      {!isSearching && currentPage === 1 && (
        <div className={`px-4 max-w-xl mx-auto flex flex-col gap-8 ${carouselMangas.length > 0 ? 'mt-4' : 'mt-32'}`}>
          
          {/* SECTION 2: PENGUMUMAN */}
          {adminAnnouncements.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-lg font-bold text-gray-200">Pengumuman</h2>
                <Link href="/pengumuman" className="text-[10px] text-gray-500 hover:text-gray-300">Semua</Link>
              </div>
              <div className="flex flex-col gap-3">
                {adminAnnouncements.map((ann) => (
                  <div key={ann.id} className="flex gap-3 bg-[#111] border border-white/5 p-3 rounded-2xl items-center shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-red-900/20 shrink-0 flex items-center justify-center border border-red-900/40">
                      <span className="text-red-800 font-extrabold text-lg">!</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-300 line-clamp-1">{ann.title}</span>
                      <span className="text-[10px] text-gray-500 mt-1">{ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: SPONSOR IKLAN ADMIN */}
          {adminSponsors.length > 0 && (
            <section>
               <div className="flex justify-between items-end mb-3">
                <h2 className="text-lg font-bold text-gray-200">Sponsor</h2>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4">
                {adminSponsors.map((iklan) => (
                  <a key={iklan.id} href={iklan.link} target="_blank" rel="noreferrer" className="relative snap-center shrink-0 w-[280px] h-[120px] rounded-xl overflow-hidden border border-white/10 shadow-md">
                    <img src={iklan.image} alt={iklan.title} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur border border-white/10 text-[8px] text-gray-400 px-1 rounded">Ad</div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 4: REKOMENDASI */}
          {favMangas.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-200">Rekomendasi</h2>
                {/* Tombol Lihat Selengkapnya (Bukan tombol ^ lagi) */}
                <Link href="/rekomendasi" className="text-[10px] text-red-700 font-bold hover:text-red-500 transition-colors">
                  Lihat Selengkapnya
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {favMangas.map((manga, idx) => {
                  let flag = "🇯🇵"; 
                  if (manga.type.toLowerCase() === "manhwa") flag = "🇰🇷";
                  if (manga.type.toLowerCase() === "manhua") flag = "🇨🇳";

                  return (
                    <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="flex flex-col gap-1.5 group">
                      <div className="relative rounded-xl overflow-hidden aspect-[2/3] border border-white/5 bg-[#111]">
                        <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-transparent to-transparent"></div>
                        <div className="absolute top-1 left-1 bg-[#111]/80 backdrop-blur-md border border-white/10 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="text-gray-400">#{idx + 1}</span>
                        </div>
                        <div className="absolute top-1 right-1 bg-[#111]/90 border border-white/5 text-xs px-1 rounded shadow">{flag}</div>
                      </div>
                      <h3 className="text-[11px] font-bold text-gray-300 line-clamp-2 leading-tight group-hover:text-gray-100 transition-colors">
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

      {/* SECTION 5: DAFTAR UPDATE TERBARU / PENCARIAN */}
      <div className={`px-4 max-w-xl mx-auto ${isSearching ? 'mt-32' : 'mt-8'}`}>
        <h2 className="text-lg font-bold mb-4 text-gray-200">{isSearching ? 'Hasil Pencarian' : 'Update Terbaru'}</h2>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Link prefetch={false} href={`/?type=semua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'semua' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300 backdrop-blur-sm'}`}>Semua</Link>
          <Link prefetch={false} href={`/?type=manhwa${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhwa' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300 backdrop-blur-sm'}`}>Manhwa</Link>
          <Link prefetch={false} href={`/?type=manga${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manga' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300 backdrop-blur-sm'}`}>Manga</Link>
          <Link prefetch={false} href={`/?type=manhua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhua' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300 backdrop-blur-sm'}`}>Manhua</Link>
        </div>

        {apiError && <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-center text-sm text-red-800">Gagal mengambil data dari Makota API.</div>}
        {!apiError && daftarKomik.length === 0 && <div className="text-center text-gray-600 text-sm mt-10">{searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Sedang memuat komik..."}</div>}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {daftarKomik.map((komik, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <Link prefetch={false} href={`/manga/${komik.slug}`} className="relative rounded-lg overflow-hidden group aspect-[2/3] border border-white/5 bg-[#111]">
                <img src={komik.cover} alt={komik.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                <div className="absolute bottom-2 right-2 bg-[#050505]/80 backdrop-blur-md border border-white/5 text-xs px-1.5 py-0.5 rounded shadow flex gap-1 items-center">
                  <span className="text-[10px] text-gray-400 font-bold pr-1 border-r border-white/10">{komik.type}</span>
                  <span>{komik.flag}</span>
                </div>
              </Link>
              
              <div className="mt-1">
                <h3 className="text-[13px] font-bold text-gray-300 line-clamp-2 leading-tight group-hover:text-gray-100">
                  {komik.isUp && <span className="bg-red-900 border border-red-800 text-gray-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded mr-1.5 align-middle shadow-sm">UP</span>}
                  {komik.title}
                </h3>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                {komik.chapters.map((ch: any, cIdx: number) => (
                  <Link prefetch={false} key={cIdx} href={`/baca/${komik.slug}/${ch.slug}`} className="flex justify-between items-center bg-white/5 hover:bg-red-900/20 text-gray-400 hover:text-gray-200 text-[11px] font-medium px-2.5 py-2 rounded transition-all border border-transparent hover:border-red-900/30">
                    <span className="truncate pr-2">{ch.name}</span>
                    <span className="text-gray-600 text-[9px] whitespace-nowrap">{ch.time}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            {currentPage > 1 && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage - 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs hover:bg-white/5 transition-all text-gray-400">{"<"}</Link>
            )}
            
            {paginationArray.map(pageNum => (
              <Link prefetch={false} key={pageNum} href={`${baseQuery}&page=${pageNum}`} className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.5)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:bg-white/5'}`}>
                {pageNum}
              </Link>
            ))}

            {currentPage < totalPages && (
              <Link prefetch={false} href={`${baseQuery}&page=${currentPage + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs hover:bg-white/5 transition-all text-gray-400">{">"}</Link>
            )}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area shadow-[0_-5px_30px_rgba(0,0,0,0.9)] z-50">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-red-800 pb-2">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mb-1 mix-blend-screen" style={{ filter: 'drop-shadow(0 0 5px rgba(127,29,29,0.5)) sepia(1) hue-rotate(320deg) saturate(500%) brightness(0.7)' }} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-600 hover:text-gray-400 pb-2 transition-colors">
          <img src="/ic-compas.jpg" alt="Explore" className="w-5 h-5 mb-1 opacity-50 mix-blend-screen" />
          <span className="text-[10px] font-medium">Explore</span>
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
