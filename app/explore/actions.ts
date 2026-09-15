'use server';

// Fetch komik berdasarkan Genre
export async function fetchMangasByGenre(genreName: string) {
  try {
    const token = process.env.MAKOTA_API_TOKEN;
    if (!token) return [];

    const res = await fetch(`https://api.makota.asia/api/v1/manga/search?genre=${encodeURIComponent(genreName.toLowerCase())}&limit=16`, {
      headers: { "Makota-API": token },
      cache: 'no-store'
    });
    
    const data = await res.json();
    if (data.ok && data.data?.results) {
      return data.data.results;
    }
    return [];
  } catch (error) {
    console.error("Fetch Genre Error:", error);
    return [];
  }
}

// Fetch komik Populer (Sedang Tren)
export async function fetchPopularMangas() {
  try {
    const token = process.env.MAKOTA_API_TOKEN;
    if (!token) return [];

    const res = await fetch(`https://api.makota.asia/api/v1/manga/popular?limit=16`, {
      headers: { "Makota-API": token },
      next: { revalidate: 3600 } // Cache 1 jam agar loading cepat
    });
    
    const data = await res.json();
    if (data.ok && data.data?.results) {
      return data.data.results;
    }
    return [];
  } catch (error) {
    console.error("Fetch Popular Error:", error);
    return [];
  }
}
