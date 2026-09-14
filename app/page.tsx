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
        daftarKomik = allMangas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      }
    }
  } catch (error) {
    // Tangani error API
  }

  const tabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'Manhwa', label: 'Manhwa' },
    { id: 'Manga', label: 'Manga' },
    { id: 'Manhua', label: 'Manhua' },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-red-900/50">
      
      {/* HEADER & SEARCH */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur px-4 py-4 flex flex-col gap-3 border-b border-white/5 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-extrabold tracking-widest text-white">SDC<span className="text-red-600">.</span></h1>
        </div>
        <SearchBar activeTab={activeTab} />

        {/* KATEGORI TAB */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/?type=${tab.id}&page=1`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  isActive 
                    ? 'bg-red-700 text-white shadow-lg shadow-red-900/30' 
                    : 'bg-[#18181b] text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <div className="px-4 mt-5 max-w-xl mx-auto flex flex-col gap-6">
        
        {/* CAROUSEL POPULER */}
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
            <div className="text-center py-16 text-gray-500 text-xs bg-[#111] rounded-2xl border border-white/5">
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
    </main>
  );
}
