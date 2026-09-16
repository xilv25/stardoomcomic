import Link from 'next/link';
import HomeHeader from './HomeHeader';
import DonationPopup from './DonationPopup';
import { createClient } from '@supabase/supabase-js';

type PageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

export default async function Home(props: PageProps) {
  const resolvedSearch = await props.searchParams;
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
  const headers = { "Makota-API": MAKOTA_TOKEN };

  let adminAnnouncements: any[] = [];
  let adminAds: any[] = []; 
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    if (supabaseUrl && supabaseKey) {
      const supabaseDb = createClient(supabaseUrl, supabaseKey);
      
      const { data: annData } = await supabaseDb
        .from('announcements')
        .select('id, title, content, image_url, date')
        .order('created_at', { ascending: false })
        .limit(2);
      if (annData) adminAnnouncements = annData;
      
      const { data: spsData } = await supabaseDb
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });
      if (spsData) adminAds = spsData;
    }
  } catch (e) {
    console.error("Error fetching admin data:", e);
  }

  try {
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

    const urlParams = new URLSearchParams();
    let mangas: any[] = [];

    if (isSearching) {
      urlParams.append('limit', ITEMS_PER_PAGE.toString());
      urlParams.append('page', currentPage.toString());
      if (activeTab !== 'semua') urlParams.append('type', activeTab);
      urlParams.append('q', searchQuery);

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/search?${urlParams.toString()}`, { headers, cache: 'no-store' });
      const listData = await resList.json();
      if (listData.ok && listData.data?.results) {
        mangas = listData.data.results;
        totalPages = Math.ceil((listData.data.total || 0) / ITEMS_PER_PAGE);
      }
    } else {
      urlParams.append('limit', '10'); 
      if (activeTab !== 'semua') urlParams.append('type', activeTab);
      urlParams.append('page', currentPage.toString());

      const resList = await fetch(`https://api.makota.asia/api/v1/manga/latest?${urlParams.toString()}`, { headers, cache: 'no-store' });
      const listData = await resList.json();
      if (listData.ok && listData.data?.results) {
        mangas = listData.data.results;
        totalPages = listData.data.total ? Math.ceil(listData.data.total / 10) : 10;
      }
    }

    let detailedMangas = mangas;
    if (mangas.length > 0) {
      detailedMangas = await Promise.all(mangas.map(async (m: any) => {
        try {
          const detailRes = await fetch(`https://api.makota.asia/api/v1/manga/${m.slug}`, { headers, next: { revalidate: 60 } });
          const detailData = await detailRes.json();
          if (detailData.ok && detailData.data?.manga?.chapters) {
            return { ...m, chapters: detailData.data.manga.chapters };
          }
        } catch (e) {}
        return m;
      }));
    }

    daftarKomik = detailedMangas.map((manga: any) => {
      let flag = "🇯🇵"; 
      const type = manga.type?.toLowerCase() || 'manga';
      if (type.includes("manhwa")) flag = "🇰🇷";
      if (type.includes("manhua")) flag = "🇨🇳";

      let mappedChapters: any[] = [];
      if (manga.chapters && Array.isArray(manga.chapters)) {
        const sortedChapters = [...manga.chapters].sort((a: any, b: any) => {
          const numA = parseFloat(a.name.match(/\d+(\.\d+)?/)?.[0] || "0");
          const numB = parseFloat(b.name.match(/\d+(\.\d+)?/)?.[0] || "0");
          return numB - numA; 
        });

        mappedChapters = sortedChapters.slice(0, 3).map((ch: any) => {
          let isNew = false;
          const rawDate = ch.date || ch.created_at || ch.updated_at || ch.release_date || ch.time;
          
          if (rawDate) {
            const parsedTime = new Date(rawDate).getTime();
            if (!isNaN(parsedTime)) {
              const diffDays = (Date.now() - parsedTime) / (1000 * 60 * 60 * 24);
              if (diffDays <= 7 && diffDays >= 0) {
                isNew = true;
              }
            } else if (typeof rawDate === 'string') {
              const lower = rawDate.toLowerCase();
              if (lower.includes('jam') || lower.includes('menit') || lower.includes('detik') || (lower.includes('hari') && parseInt(rawDate) <= 7)) {
                isNew = true;
              }
            }
          }

          return {
            name: ch.name,
            slug: ch.slug,
            time: isNew ? "Baru" : ""
          };
        });
      } else if (manga.latest_chapter) {
        mappedChapters = [{ name: manga.latest_chapter, slug: manga.slug, time: "Baru" }];
      }

      return {
        title: manga.title,
        slug: manga.slug,
        cover: manga.thumbnail_url || manga.cover,
        type: manga.type || 'Manga',
        flag: flag,
        isUp: true,
        chapters: mappedChapters
      };
    });

  } catch (error) {
    apiError = true;
  }

  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  
  const diffPage = endPage - startPage + 1;
  if (diffPage < MAX_PAGES) {
    startPage = Math.max(1, endPage - MAX_PAGES + 1);
  }

  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  
  let baseQueryStr = "?type=" + activeTab;
  if (searchQuery) {
    baseQueryStr += "&q=" + searchQuery;
  }

  const iconPrev = "<";
  const iconNext = ">";

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50 overflow-x-hidden relative">
      
      <DonationPopup />
      <HomeHeader activeTab={activeTab} />

      {/* ================= SECTION CAROUSEL ================= */}
      {!isSearching && currentPage === 1 && carouselMangas.length > 0 && (
        <section className="relative w-full h-[55vh] sm:h-[60vh]">
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full">
            {carouselMangas.map((manga) => (
              <Link prefetch={false} key={manga.slug} href={`/manga/${manga.slug}`} className="relative snap-center shrink-0 w-full h-full group">
                <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                
                <div className="absolute bottom-8 left-4 right-4 flex flex-col">
                  <span className="bg-red-900/90 border border-red-800 text-white text-[10px] font-extrabold px-3 py-1 rounded-md w-max mb-2 shadow-lg">{manga.type || 'Manga'}</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-1">{manga.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= SECTION FAVORITE MANGAS ================= */}
      {!isSearching && currentPage === 1 && favMangas.length > 0 && (
        <section className="px-4 max-w-xl mx-auto mt-6 relative z-10">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-lg font-bold text-gray-200">Terpopuler</h2>
            <Link href="/explore" className="text-[10px] text-gray-400 hover:text-white font-bold bg-[#111] px-2.5 py-1.5 rounded-md border border-white/10 transition-colors shadow-sm">
              Lihat Semua
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
            {favMangas.map((manga, idx) => (
              <Link 
                prefetch={false} 
                key={manga.slug} 
                href={`/manga/${manga.slug}`} 
                className="relative shrink-0 w-[140px] h-[200px] rounded-xl overflow-hidden shadow-lg snap-center group border border-white/5 bg-[#111]"
              >
                <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div className="absolute top-2 left-2 w-6 h-6 bg-red-900/80 backdrop-blur-md rounded border border-red-500/50 flex items-center justify-center text-[10px] font-extrabold shadow">
                  #{idx + 1}
                </div>

                <div className="absolute bottom-3 left-2 right-2 flex flex-col">
                  <h3 className="text-[11px] font-bold text-white line-clamp-2 leading-tight drop-shadow-md">{manga.title}</h3>
                  <span className="text-[9px] text-red-400 mt-1">{manga.type || 'Manga'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className={`px-4 max-w-xl mx-auto flex flex-col gap-8 ${isSearching ? 'mt-32' : 'mt-6'}`}>
        
        {/* ================= SECTION PENGUMUMAN (Hanya Page 1 & Bukan Search) ================= */}
        {!isSearching && currentPage === 1 && adminAnnouncements.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-3">
              <h2 className="text-lg font-bold text-gray-200">Pengumuman</h2>
              <Link href="/pengumuman" className="text-[10px] text-gray-500 hover:text-gray-300 bg-[#111] px-2.5 py-1.5 rounded-md border border-white/10 transition-colors shadow-sm">
                Semua
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {adminAnnouncements.map((ann) => {
                const truncatedContent = ann.content && ann.content.length > 50 
                  ? ann.content.substring(0, 50) + "..." 
                  : ann.content;

                return (
                  <Link 
                    key={ann.id} 
                    href={`/pengumuman/${ann.id}`} 
                    className="flex gap-3 bg-[#111] border border-white/5 p-3 rounded-2xl items-start shadow-md hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-900/20 shrink-0 flex items-center justify-center border border-red-900/40 mt-0.5">
                      <span className="text-red-800 font-extrabold text-lg">!</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-2">
                         <span className="text-sm font-bold text-gray-200 line-clamp-1 group-hover:text-red-400 transition-colors">{ann.title}</span>
                         <span className="text-[9px] text-gray-500 whitespace-nowrap pt-1">{ann.date}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-snug">
                        {truncatedContent} <span className="text-red-500 font-semibold italic">Baca selengkapnya</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= SECTION SPONSOR (Hanya Page 1 & Bukan Search) ================= */}
        {!isSearching && currentPage === 1 && adminAds.length > 0 && (
          <section>
             <div className="flex justify-between items-end mb-3">
              <h2 className="text-lg font-bold text-gray-200">Sponsor</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 pb-2 -mx-4 px-4">
              {adminAds.map((iklan) => (
                <a 
                  key={iklan.id} 
                  href={iklan.link || '#'} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="relative snap-center shrink-0 w-[280px] h-[150px] rounded-xl overflow-hidden border border-white/10 shadow-md group"
                >
                  <img src={iklan.image_url} alt={iklan.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur border border-white/10 text-[8px] text-gray-300 font-bold px-1.5 py-0.5 rounded">Ad</div>
                  <div className="absolute bottom-3 left-3 right-3 flex flex-col">
                    <span className="text-[13px] font-extrabold text-white drop-shadow-md line-clamp-1">{iklan.title}</span>
                    {iklan.description && (
                      <span className="text-[10px] text-gray-300 line-clamp-1 mt-0.5 opacity-90">{iklan.description}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ================= SECTION UPDATE TERBARU / HASIL PENCARIAN ================= */}
      <div className={`px-4 max-w-xl mx-auto ${!isSearching && currentPage > 1 ? 'mt-32' : 'mt-8'}`}>
        <h2 className="text-lg font-bold mb-4 text-gray-200">{isSearching ? 'Hasil Pencarian' : 'Update Terbaru'}</h2>

        {/* Filter Tab (Hanya tampil di Page 1) */}
        {currentPage === 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Link prefetch={false} href={`/?type=semua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'semua' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300'}`}>Semua</Link>
            <Link prefetch={false} href={`/?type=manhwa${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhwa' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300'}`}>Manhwa</Link>
            <Link prefetch={false} href={`/?type=manga${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manga' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300'}`}>Manga</Link>
            <Link prefetch={false} href={`/?type=manhua${searchQuery ? '&q='+searchQuery : ''}&page=1`} className={`shrink-0 px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'manhua' ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.3)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:text-gray-300'}`}>Manhua</Link>
          </div>
        )}

        {apiError && <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-center text-sm text-red-800">Gagal mengambil data dari Makota API.</div>}
        {!apiError && daftarKomik.length === 0 && <div className="text-center text-gray-600 text-sm mt-10">{searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Sedang memuat komik..."}</div>}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {daftarKomik.map((komik, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <Link prefetch={false} href={`/manga/${komik.slug}`} className="relative rounded-lg overflow-hidden group aspect-[2/3] border border-white/5 bg-[#111]">
                <img src={komik.cover} alt={komik.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                <div className="absolute bottom-2 right-2 bg-[#050505]/80 backdrop-blur-md border border-white/5 text-[9px] px-1.5 py-0.5 rounded shadow flex gap-1 items-center">
                  <span className="text-gray-300 font-bold pr-1 border-r border-white/10">{komik.type}</span>
                  <span>{komik.flag}</span>
                </div>
              </Link>
              
              <div className="mt-1">
                <h3 className="text-[13px] font-bold text-gray-300 line-clamp-2 leading-tight group-hover:text-gray-100">
                  {komik.isUp && <span className="bg-red-900 border border-red-800 text-gray-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded mr-1.5 align-middle shadow-sm">UP</span>}
                  {komik.title}
                </h3>
              </div>
              
              {komik.chapters && komik.chapters.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {komik.chapters.map((ch: any, cIdx: number) => (
                    <Link prefetch={false} key={cIdx} href={`/baca/${komik.slug}/${ch.slug}`} className="flex justify-between items-center bg-[#111] hover:bg-red-900/20 text-gray-400 hover:text-gray-200 text-[10px] font-bold px-2.5 py-2 rounded-lg transition-all border border-white/5 hover:border-red-900/30">
                      <span className="truncate pr-2">{ch.name}</span>
                      {ch.time && <span className="text-red-500 text-[9px] font-extrabold whitespace-nowrap">{ch.time}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            {currentPage > 1 && (
              <Link prefetch={false} href={`${baseQueryStr}&page=${currentPage - 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs hover:bg-white/5 transition-all text-gray-400">
                {iconPrev}
              </Link>
            )}
            
            {paginationArray.map(pageNum => (
              <Link prefetch={false} key={pageNum} href={`${baseQueryStr}&page=${pageNum}`} className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.5)] border border-red-800' : 'bg-[#111] border border-white/5 text-gray-500 hover:bg-white/5'}`}>
                {pageNum}
              </Link>
            ))}

            {currentPage < totalPages && (
              <Link prefetch={false} href={`${baseQueryStr}&page=${currentPage + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#111] border border-white/5 text-xs hover:bg-white/5 transition-all text-gray-400">
                {iconNext}
              </Link>
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
