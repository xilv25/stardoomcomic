import ReaderUI from './ReaderUI';

export default async function ChapterReaderPage({ 
  params 
}: { 
  params: Promise<{ komik: string, chapter: string }> 
}) {
  const resolvedParams = await params;
  const { komik, chapter } = resolvedParams;
  
  let chapterData = null;
  let mangaData = null;

  try {
    const [resPages, resManga] = await Promise.all([
      fetch(`https://api.makota.asia/api/v1/manga/${komik}/pages/${chapter}`, {
        headers: { "Makota-API": process.env.MAKOTA_API_TOKEN as string },
        next: { revalidate: 60 } 
      }),
      fetch(`https://api.makota.asia/api/v1/manga/${komik}`, {
        headers: { "Makota-API": process.env.MAKOTA_API_TOKEN as string },
        next: { revalidate: 60 }
      })
    ]);
    
    const rawPages = await resPages.json();
    const rawManga = await resManga.json();

    if (rawPages.ok && rawManga.ok) {
      chapterData = rawPages.data;
      mangaData = rawManga.data.manga;
    }
  } catch (error) {
    console.error(error);
  }

  if (!chapterData) {
    return (
      <main className="min-h-screen bg-[#020202] text-white flex items-center justify-center">
        <div className="bg-red-900/30 p-6 rounded text-red-300 border border-red-500/30">
          Gagal memuat chapter atau komik tidak ditemukan.
        </div>
      </main>
    );
  }

  // Kalkulasi Next/Prev sebelum dilempar ke UI
  let prevCh = null; 
  let nextCh = null; 

  if (mangaData) {
    let chapterList = [...mangaData.chapters];
    const firstChNum = parseInt(chapterList[0]?.name.match(/\d+/)?.[0] || "0");
    const lastChNum = parseInt(chapterList[chapterList.length - 1]?.name.match(/\d+/)?.[0] || "0");
    if (firstChNum < lastChNum) chapterList.reverse();

    const currentIdx = chapterList.findIndex((c: any) => c.slug === chapter);
    if (currentIdx !== -1) {
      if (currentIdx > 0) nextCh = chapterList[currentIdx - 1].slug;
      if (currentIdx < chapterList.length - 1) prevCh = chapterList[currentIdx + 1].slug;
    }
  }

  const judulKomik = mangaData?.title || komik.replace(/-/g, ' ');
  const namaChapter = chapterData?.chapter?.name || chapter;

  return (
    <ReaderUI 
      komik={komik} 
      chapter={chapter} 
      chapterData={chapterData} 
      mangaData={mangaData} 
      prevCh={prevCh} 
      nextCh={nextCh} 
      judulKomik={judulKomik} 
      namaChapter={namaChapter} 
    />
  );
}
