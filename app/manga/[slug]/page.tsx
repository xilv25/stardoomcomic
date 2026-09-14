import Link from 'next/link';

export default async function MangaDetail({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Ambil nomor halaman dari URL (default: 1)
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
    if (data.ok) {
      komik = data.data.manga;
      
      // AUTO-REVERSE: Pastikan Chapter 1 ada di paling BAWAH (terbaru di atas)
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
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-red-400">{errorMsg || "Sedang memuat..."}</p>
      </main>
    );
  }

  const chapterTerbaru = komik.chapters[0]?.slug;
  const chapterPertama = komik.chapters[komik.chapters.length - 1]?.slug;

  // LOGIKA PAGINASI (25 Chapter per halaman)
  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(komik.chapters.length / ITEMS_PER_PAGE);
  const currentChapters = komik.chapters.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Buat array nomor halaman [1, 2, 3, 4, 5] yang dinamis
  const MAX_PAGES = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + MAX_PAGES - 1);
  if (endPage - startPage + 1 < MAX_PAGES) {
    startPage = Math.max(1, endPage - MAX_PAGES + 1);
  }
  const paginationArray = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-red-900/50 relative">
      <div className="absolute top-0 w-full h-[50vh] overflow-hidden opacity-20 z-0">
        <img src={komik.thumbnail_url} alt="bg" className="w-full h-full object-cover blur-3xl scale-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]"></div>
      </div>

      <header className="sticky top-0 z-50 px-4 py-4 flex justify-between items-center bg-transparent">
        <Link href="/" className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-xl hover:bg-red-900/50">
          ←
        </Link>
        <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-xl">
          ⋮
        </button>
      </header>

      <div className="relative z-10 px-4 max-w-xl mx-auto">
        <div className="flex gap-4 items-end mb-6">
          <div className="w-32 sm:w-40 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
            <img src={komik.thumbnail_url} alt={komik.title} className="w-full h-auto aspect-[2/3] object-cover" />
            <div className="absolute top-0 left-0 bg-red-700 text-[10px] font-bold px-2 py-1 rounded-br-lg">{komik.rating} ⭐</div>
          </div>
          <div className="flex flex-col gap-1.5 pb-1">
            <h1 className="text-2xl font-extrabold leading-tight text-white">{komik.title}</h1>
            <p className="text-sm text-gray-400 font-medium">{komik.author}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] px-2 py-1 bg-white/10 border border-white/5 rounded text-gray-300">{komik.type}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {chapterPertama && (
            <Link href={`/baca/${komik.slug}/${chapterPertama}`} className="flex-1 bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-center shadow-[0_0_20px_rgba(153,27,27,0.4)] border border-red-500/30">
              Mulai Baca (Ch. 1)
            </Link>
          )}
          <button className="w-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-xl">
            🔖
          </button>
        </div>

        <div className="mb-8 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <h3 className="text-sm font-bold mb-2 text-gray-200">Sinopsis</h3>
          <p className="text-xs text-gray-400 leading-relaxed text-justify line-clamp-4">{komik.description}</p>
        </div>

        {/* DAFTAR CHAPTER (Limit 25) */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold border-l-4 border-red-600 pl-2">Daftar Chapter</h3>
            <span className="text-xs text-gray-500">{komik.chapters.length} Total</span>
          </div>
          
          <div className="flex flex-col gap-2">
            {currentChapters.map((ch: any) => (
              <Link key={ch.slug} href={`/baca/${komik.slug}/${ch.slug}`} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:border-red-500/40 hover:bg-red-900/20 group">
                <span className="text-sm font-bold text-gray-200 group-hover:text-white">{ch.name}</span>
                <span className="text-xs text-gray-500 group-hover:text-red-400">▶</span>
              </Link>
            ))}
          </div>

          {/* KONTROL PAGINASI */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link href={`?page=${currentPage - 1}`} className="w-8 h-8 flex items-center justify-center rounded bg-white/5 border border-white/10 text-xs hover:bg-red-900/50">{"<"}</Link>
              )}
              
              {paginationArray.map(pageNum => (
                <Link key={pageNum} href={`?page=${pageNum}`} className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-red-700 text-white shadow-[0_0_10px_rgba(153,27,27,0.5)] border border-red-500' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                  {pageNum}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link href={`?page=${currentPage + 1}`} className="w-8 h-8 flex items-center justify-center rounded bg-white/5 border border-white/10 text-xs hover:bg-red-900/50">{">"}</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
