import MangaClient from './MangaClient';

export default async function MangaDetail({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const resolvedSearch = await searchParams;
  const currentPage = parseInt(resolvedSearch?.page || '1', 10);
  
  let komik = null;
  let errorMsg = null;

  try {
    const res = await fetch(`https://api.makota.asia/api/v1/manga/${slug}`, {
      headers: { "Makota-API": process.env.MAKOTA_API_TOKEN as string },
      next: { revalidate: 60 } 
    });
    
    const data = await res.json();
    if (data.ok && data.data?.manga) {
      komik = data.data.manga;
      
      const firstChNum = parseInt(komik.chapters[0]?.name.match(/\d+/)?.[0] || "0");
      const lastChNum = parseInt(komik.chapters[komik.chapters.length - 1]?.name.match(/\d+/)?.[0] || "0");
      if (firstChNum < lastChNum) {
        komik.chapters.reverse();
      }
    } else {
      errorMsg = "Data komik tidak ditemukan.";
    }
  } catch (error) {
    errorMsg = "Gagal terhubung ke server Makota.";
  }

  if (errorMsg || !komik) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <p className="text-red-800 font-bold">{errorMsg || "Sedang memuat..."}</p>
      </main>
    );
  }

  const chapterPertama = komik.chapters[komik.chapters.length - 1]?.slug;

  // LOGIKA PAGINASI (25 Chapter per halaman)
  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(komik.chapters.length / ITEMS_PER_PAGE);
  const currentChapters = komik.chapters.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  if (endPage - startPage + 1 < MAX_PAGES) {
    startPage = Math.max(1, endPage - MAX_PAGES + 1);
  }
  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <MangaClient 
      komik={komik} 
      chapterPertama={chapterPertama} 
      currentChapters={currentChapters}
      currentPage={currentPage}
      totalPages={totalPages}
      paginationArray={paginationArray}
    />
  );
}
