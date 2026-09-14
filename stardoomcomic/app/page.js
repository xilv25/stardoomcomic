      import Link from 'next/link';
import SearchBar from './SearchBar';

export default async function Home({ searchParams }) {
  const resolvedSearch = await searchParams;
  const searchQuery = resolvedSearch?.q || '';
  const activeTab = resolvedSearch?.type || 'semua';
  const currentPage = parseInt(resolvedSearch?.page || '1');
  const isSearching = !!searchQuery;

  let daftarKomik = [];
  let carouselMangas = [];
  let totalPages = 1;
  const ITEMS_PER_PAGE = 8;
  const MAKOTA_TOKEN = "mki.eyJ1aWQiOjc5LCJ0eXBlIjoiYXBpIiwianRpIjoiZGNlYzc5ZjdkMmI3MWM5NmE5NGEzZjk4OTJiM2EzMWMiLCJpYXQiOjE3ODg3MjkwMTZ9.rD7LZleCzUAPZmFbQvOsSSzsDSsTjPPDDYzLzElomTM";

  try {
    const headers = { "Makota-API": MAKOTA_TOKEN };
    
    if (!isSearching && currentPage === 1) {
      const resPopular = await fetch(`https://api.makota.asia/api/v1/manga/popular?limit=8`, {
        headers, next: { revalidate: 3600 } 
      });
      const popData = await resPopular.json();
      if (popData.ok && popData.data?.results) {
        carouselMangas = popData.data.results.slice(0, 5);
      }
    }

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
    // Tangani error API dengan aman
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50">
      
      {/* HEADER & SEARCH */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] px-4 py-4 flex flex-col gap-4 border-b border-white/5 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-extrabold tracking-widest text-white">SDC<span className="text-red-600">.</span></h1>
          <Link prefetch={false} href="/explore" className="text-xs bg-[#18181b] border border-white/10 px-3 py-1.5 rounded-lg font-bold text-gray-300 hover:text-white">
            Explore
          </Link>
        </div>
        <SearchBar initialQuery={searchQuery} activeTab={activeTab} />
      </header>

      <div className="px-4 mt-5 max-w-xl mx-auto flex flex-col gap-6">
        
        {/* CAROUSEL POPULAR */}
        {!isSearching && carouselMangas.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Populer Hari Ini</h2>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
              {carouselMangas.map((manga) => (
                <div key={manga.slug} className="shrink-0 w-[180px] h-[110px] rounded-xl overflow-hidden bg-[#18181b] relative border border-white/5 shadow">
                  <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[11px] font-bold text-white line-clamp-1">{manga.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIST KOMIK UTAMA */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isSearching ? `Hasil Pencarian: "${searchQuery}"` : 'Komik Terbaru'}
          </h2>

          {daftarKomik.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm bg-[#111] rounded-2xl border border-white/5">
              Komik tidak ditemukan atau gagal memuat data API.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {daftarKomik.map((komik, idx) => (
                <div key={idx} className="flex flex-col gap-2 group">
                  <div className="relative rounded-lg overflow-hidden aspect-[2/3] border border-white/5 bg-[#111]">
                    <img src={komik.thumbnail_url || komik.cover} alt={komik.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-2 left-2 bg-red-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                      {komik.type || 'Manhwa'}
                    </div>
                  </div>
                  <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                    {komik.title}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-[#0a0a0a] border-t border-white/5 flex justify-around items-center pt-3 pb-safe-area z-50 shadow-lg">
        <Link prefetch={false} href="/" className="flex flex-col items-center text-red-500 pb-2">
          <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link prefetch={false} href="/explore" className="flex flex-col items-center text-gray-500 pb-2 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link prefetch={false} href="/library" className="flex flex-col items-center text-gray-500 pb-2 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5 mb-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link prefetch={false} href="/profile" className="flex flex-col items-center text-gray-500 pb-2 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5 mb-1 opacity-80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

    </main>
  );
            }
