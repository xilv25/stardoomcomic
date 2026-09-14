'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ initialQuery, activeTab }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?type=${activeTab}&q=${encodeURIComponent(query)}&page=1`);
    } else {
      router.push(`/?type=${activeTab}&page=1`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Cari komik, manhwa, manga..." 
        className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 shadow-inner"
      />
    </form>
  );
}
