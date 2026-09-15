'use server';

export async function fetchSearchSuggest(query: string) {
  try {
    const token = process.env.MAKOTA_API_TOKEN;
    if (!token) return { ok: false, data: { results: [] } };

    const res = await fetch(`https://api.makota.asia/api/v1/manga/search?q=${encodeURIComponent(query)}&limit=3`, {
      headers: { "Makota-API": token },
      cache: 'no-store'
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Search API Error:", error);
    return { ok: false, data: { results: [] } };
  }
}
