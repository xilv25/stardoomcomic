import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type');

  if (!q || q.length < 2) return NextResponse.json([]); // Minimal 2 huruf

  const typeParam = type && type !== 'semua' ? `&type=${type}` : '';
  const apiUrl = `https://api.makota.asia/api/v1/manga/search?q=${encodeURIComponent(q)}${typeParam}&limit=5`;

  try {
    const res = await fetch(apiUrl, {
      headers: { "Makota-API": process.env.MAKOTA_API_TOKEN as string },
      cache: 'no-store'
    });
    const data = await res.json();
    
    if (data.ok && data.data.results) {
      return NextResponse.json(data.data.results);
    }
  } catch (error) {
    console.error("Gagal fecth dari Makota:", error);
  }
  
  return NextResponse.json([]);
}
