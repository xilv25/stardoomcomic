import MangaDetailClient from './MangaDetailClient';

export default async function MangaDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const MAKOTA_TOKEN = process.env.MAKOTA_API_TOKEN as string;

  let manga = null;
  let chapters: any[] = [];

  try {
    const res = await fetch(`https://api.makota.asia/api/v1/manga/${slug}`, {
      headers: { "Makota-API": MAKOTA_TOKEN },
      next: { revalidate: 60 } // Cache selama 1 menit agar kencang
    });
    
    const data = await res.json();
    
    if (data.ok && data.data?.manga) {
      manga = data.data.manga;
      chapters = manga.chapters || [];
    }
  } catch (error) {
    console.error("Fetch detail error:", error);
  }

  // Jika komik tidak ditemukan dari Makota API
  if (!manga) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="bg-red-900/30 p-6 rounded-2xl text-red-300 border border-red-900/50 font-bold text-sm">
          Komik tidak ditemukan atau gagal memuat data.
        </div>
      </main>
    );
  }

  return <MangaDetailClient slug={slug} manga={manga} chapters={chapters} />;
}
