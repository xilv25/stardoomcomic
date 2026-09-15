'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <-- Tambahkan usePathname
import { supabase } from '../../utils/supabase';
import Link from 'next/link';

export default function MangaClient({ slug, manga, chapters }: { slug: string, manga: any, chapters: any[] }) {
  const router = useRouter();
  const pathname = usePathname(); // <-- Panggil disini
  
  // State Supabase
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [lastHistory, setLastHistory] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // State UI ... (biarkan sama)
  const [currentPage, setCurrentPage] = useState(1);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const chaptersPerPage = 25;

  // Pengecekan Supabase setiap kali Pathname (rute) diakses ulang
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;

          // Cek Bookmark
          const { data: bmData } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .maybeSingle();
          if (bmData) setIsBookmarked(true);
          else setIsBookmarked(false); // Reset jika dihapus

          // Cek Riwayat Baca
          const { data: histData, error: histError } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', userId)
            .eq('manga_slug', slug)
            .maybeSingle();

          if (!histError && histData) {
            setLastHistory(histData);
          }
        }
      } catch (err) {
        console.error("Gagal memuat status user", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserStatus();
  }, [slug, pathname]); // <-- Kunci utamanya ada di sini!

// ... (sisa kode fungsi Bookmark, Share, dan UI di bawahnya tetap sama seperti sebelumnya)
