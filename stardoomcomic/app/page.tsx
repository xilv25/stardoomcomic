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
  const ITEMS_PER_PAGE = 8;

  try {
    const headers = { "Makota-API": process.env.MAKOTA_API_TOKEN as string };
    
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

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-32 font-sans">
      <header className="sticky top-0 z-50 bg-[#0a0a0a] px-4 py-4 flex flex-col gap-4 border-b border-white/5">
        <h1 className="text-xl font-extrabold tracking-widest text-white">SDC<span className="text-gray-500">.</span></h1>
        <SearchBar initialQuery={searchQuery} activeTab={activeTab} />
      </header>

      <div className="px-4 mt-5 max-w-xl mx-auto">
        {carouselMangas.length > 0 && (
          <div className="flex overflow-x-auto gap-4 pb-2">
            {carouselMangas.map((manga) => (
              <div key={manga.slug} className="shrink-0 w-[200px] h-[120px] rounded-xl overflow-hidden bg-[#18181b]">
                <img src={manga.thumbnail_url} alt={manga.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          {daftarKomik.map((komik, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="rounded-lg overflow-hidden aspect-[2/3] bg-[#111]">
                <img src={komik.thumbnail_url || komik.cover} alt={komik.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-[13px] font-bold text-gray-200 line-clamp-2">{komik.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
          }
