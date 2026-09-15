"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../../../utils/supabase';

export default function ReaderUI({ 
  komik, chapter, chapterData, mangaData, prevCh, nextCh, judulKomik, namaChapter 
}) {
  const [navVisible, setNavVisible] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [showReplies, setShowReplies] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initReader = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (isMounted) {
            setCurrentUser({
              id: session.user.id,
              username: profile?.username || session.user.email?.split('@')[0] || 'Reader',
              avatar_url: profile?.avatar_url || '/ic-profile.jpg',
              role: profile?.role || 'user'
            });
          }

          await supabase.from('reading_history').upsert({
            user_id: session.user.id,
            manga_slug: komik,
            manga_title: judulKomik || komik,
            cover_url: mangaData?.thumbnail_url || '',
            last_chapter_slug: chapter,
            last_chapter_name: namaChapter || chapter,
            updated_at: new Date()
          }, { onConflict: 'user_id, manga_slug' });
        }

        const { data: comments, error } = await supabase
          .from('chapter_comments')
          .select('*')
          .eq('manga_slug', komik)
          .eq('chapter_slug', chapter)
          .order('created_at', { ascending: false });

        if (!error && comments && isMounted) {
          setCommentsList(comments);
        }
      } catch (err) {
        console.error("Error init reader:", err);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    };

    if (komik && chapter) initReader();
    return () => { isMounted = false; };
  }, [komik, chapter, judulKomik, namaChapter, mangaData]);
  
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolledToBottom = window.innerHeight + currentScrollY >= document.body.offsetHeight - 150;
      setIsAtBottom(scrolledToBottom);

      if (currentScrollY > lastScrollY && currentScrollY > 100 && !scrolledToBottom) {
        setNavVisible(false);
        setShowSettings(false);
        setOpenMenuId(null);
      } else if (currentScrollY < lastScrollY) {
        setNavVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let animationId;
    const scroll = () => {
      if (isAutoScrolling && !isAtBottom) {
        window.scrollBy(0, scrollSpeed);
        animationId = requestAnimationFrame(scroll);
      } else if (isAtBottom && isAutoScrolling) {
        setIsAutoScrolling(false);
        setNavVisible(true);
      }
    };

    if (isAutoScrolling) {
      animationId = requestAnimationFrame(scroll);
      setNavVisible(false);
    }

    const stopAutoScroll = () => { if (isAutoScrolling) setIsAutoScrolling(false); };
    window.addEventListener('wheel', stopAutoScroll, { passive: true });
    window.addEventListener('touchstart', stopAutoScroll, { passive: true });
    window.addEventListener('mousedown', stopAutoScroll, { passive: true });
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('wheel', stopAutoScroll);
      window.removeEventListener('touchstart', stopAutoScroll);
      window.removeEventListener('mousedown', stopAutoScroll);
    };
  }, [isAutoScrolling, scrollSpeed, isAtBottom]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  const addSpoilerTag = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = commentText;
    const highlighted = text.substring(start, end) || 'teks spoiler';
    setCommentText(text.substring(0, start) + `[spoiler]${highlighted}[/spoiler]` + text.substring(end));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentUser) return alert("Silakan login terlebih dahulu!");

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `comments/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('comment-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('comment-images').getPublicUrl(filePath);
      setCommentText(prev => prev + `\n[img]${publicUrl}[/img]`);
    } catch (err) {
      alert("Gagal mengunggah gambar: " + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setIsSending(true);

    try {
      let finalContent = commentText.trim();
      if (replyingTo && replyingTo.parent_id !== null) {
        finalContent = `@${replyingTo.username} ${finalContent}`;
      }

      const newCommentData = {
        manga_slug: komik,
        chapter_slug: chapter,
        user_id: currentUser.id,
        username: currentUser.username,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
        content: finalContent,
        parent_id: replyingTo ? (replyingTo.parent_id || replyingTo.id) : null,
        created_at: new Date()
      };

      const { data, error } = await supabase.from('chapter_comments').insert([newCommentData]).select().single();

      if (error) throw error;
      if (data) {
        setCommentsList([data, ...commentsList]);
        setCommentText('');
        setReplyingTo(null);
        if (data.parent_id) {
          setShowReplies(prev => ({ ...prev, [data.parent_id]: true }));
        }
      }
    } catch (err) {
      alert("Gagal mengirim komentar: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;
    try {
      const { error } = await supabase.from('chapter_comments').delete().eq('id', commentId);
      if (error) throw error;
      setCommentsList(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
    setOpenMenuId(null);
  };

  const handleReportComment = () => {
    alert("Komentar berhasil dilaporkan ke Admin untuk ditinjau.");
    setOpenMenuId(null);
  };

  const toggleReplies = (parentId) => {
    setShowReplies(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  const renderImages = (text, keyPrefix) => {
    const imgRegex = new RegExp('(\\[img\\][\\s\\S]*?\\[/img\\])', 'g');
    const imgParts = text.split(imgRegex);
    
    return imgParts.map((part, i) => {
      if (part.startsWith('[img]') && part.endsWith('[/img]')) {
        const url = part.replace('[img]', '').replace('[/img]', '');
        return <img key={`${keyPrefix}-img-${i}`} src={url} alt="Uploaded" className="max-w-[200px] max-h-48 rounded-xl mt-2 object-cover border border-white/10 shadow-lg block" loading="lazy" />;
      }
      return <span key={`${keyPrefix}-txt-${i}`}>{part}</span>;
    });
  };

  const renderFormattedContent = (text) => {
    const spoilerRegex = new RegExp('(\\[spoiler\\][\\s\\S]*?\\[/spoiler\\])', 'g');
    const spoilerParts = text.split(spoilerRegex);
    
    return spoilerParts.map((part, i) => {
      if (part.startsWith('[spoiler]') && part.endsWith('[/spoiler]')) {
        const actualText = part.replace('[spoiler]', '').replace('[/spoiler]', '');
        return (
          <span key={`spoiler-${i}`} className="bg-white/10 text-transparent hover:text-white px-2 py-1 rounded blur-[6px] hover:blur-none transition-all duration-300 cursor-pointer border border-white/5 select-none hover:select-auto inline-block align-middle overflow-hidden group mb-1">
            <span className="group-hover:opacity-100 opacity-60 transition-opacity">
              {renderImages(actualText, `innerspoiler-${i}`)}
            </span>
          </span>
        );
      }
      return renderImages(part, `outer-${i}`);
    });
  };

  const mainComments = commentsList.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-red-900/50 pb-10 font-sans relative">
      
      {openMenuId && (
        <div className="fixed inset-0 z-[60]" onClick={() => setOpenMenuId(null)}></div>
      )}

      <header className={`fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl z-50 flex justify-between gap-2 transition-transform duration-500 ease-in-out ${navVisible ? 'translate-y-0' : '-translate-y-[150%]'}`}>
        <Link href={`/manga/${komik}`} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all shrink-0">
          <img src="/ic-arrow-left.jpg" alt="Back" className="w-5 h-5 mix-blend-screen opacity-80" />
        </Link>
        <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 flex items-center justify-center shadow-lg overflow-hidden">
          <div className="flex gap-2 text-[10px] sm:text-xs font-bold items-center truncate">
            <span className="text-gray-200 truncate">{judulKomik}</span>
            <span className="text-gray-500">›</span>
            <span className="text-red-400 whitespace-nowrap">{namaChapter}</span>
          </div>
        </div>
        <Link href="/" className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all shrink-0">
          <img src="/ic-home.jpg" alt="Home" className="w-5 h-5 mix-blend-screen opacity-80" />
        </Link>
      </header>

      <div className={`fixed right-4 bottom-24 z-40 flex flex-col gap-2 transition-opacity duration-300 ${navVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={scrollToTop} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all" title="Ke Atas"><img src="/ic-up.jpg" alt="Up" className="w-5 h-5 mix-blend-screen opacity-80" /></button>
        <button onClick={scrollToBottom} className="w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/10 transition-all" title="Ke Bawah"><img src="/ic-down.jpg" alt="Down" className="w-5 h-5 mix-blend-screen opacity-80" /></button>
      </div>

      <div 
        className="max-w-2xl mx-auto flex flex-col items-center pt-24 min-h-screen cursor-pointer"
        onClick={() => { setNavVisible(!navVisible); setShowSettings(false); setOpenMenuId(null); }}
      >
        {chapterData.pages.map((pageUrl, index) => (
          <img 
            key={index} 
            src={pageUrl} 
            alt="Halaman Komik" 
            className="w-full h-auto object-contain block m-0 p-0" 
            loading={index === 0 || index === 1 ? "eager" : "lazy"} 
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        <div className="flex justify-between items-center gap-4 py-6 border-b border-white/5">
          {prevCh ? (
            <Link href={`/baca/${komik}/${prevCh}`} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all">
              <img src="/ic-chevron-left.jpg" alt="Prev" className="w-4 h-4 mix-blend-screen opacity-70" />
              <span className="text-sm font-bold text-gray-300">Prev Chapter</span>
            </Link>
          ) : <div className="flex-1"></div>}

          {nextCh ? (
            <Link href={`/baca/${komik}/${nextCh}`} className="flex-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-[0_0_20px_rgba(153,27,27,0.3)]">
              <span className="text-sm font-bold text-white">Next Chapter</span>
              <img src="/ic-chevron-right.jpg" alt="Next" className="w-4 h-4 mix-blend-screen opacity-90" />
            </Link>
          ) : (
             <div className="flex-1 bg-white/5 py-3.5 rounded-xl text-center text-sm font-bold text-gray-600">Mentok Raw</div>
          )}
        </div>

        <div className="mt-8 pb-36">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
            💬 Diskusi Chapter ({commentsList.length})
          </h3>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-8 focus-within:border-red-500/50 focus-within:bg-white/10 transition-all shadow-inner relative">
            {replyingTo && (
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg mb-2 border border-white/10 text-xs text-gray-300">
                <span>Membalas <strong className="text-red-400">@{replyingTo.username}</strong></span>
                <button onClick={() => setReplyingTo(null)} className="text-red-500 font-bold hover:underline">Batalkan</button>
              </div>
            )}

            <textarea 
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={currentUser ? "Tulis teorimu di sini..." : "Silakan login untuk berkomentar..."}
              disabled={!currentUser}
              className="w-full bg-transparent text-sm text-white focus:outline-none resize-none min-h-[70px] placeholder:text-gray-600 disabled:opacity-50"
            ></textarea>
            
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
              <div className="flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={!currentUser || uploadingImage} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 hover:border-gray-400 flex items-center justify-center text-sm transition-all text-gray-400 disabled:opacity-30" title="Upload Gambar">{uploadingImage ? '⏳' : '📷'}</button>
                <button onClick={addSpoilerTag} disabled={!currentUser} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 hover:border-red-500/50 hover:text-red-400 flex items-center justify-center text-sm transition-all text-gray-400 disabled:opacity-30" title="Sensor Spoiler">👁️‍🗨️</button>
              </div>
              <button onClick={handlePostComment} disabled={isSending || !currentUser} className="px-5 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow">{isSending ? 'Mengirim...' : 'Kirim'}</button>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            {loadingComments ? (
              <div className="text-center text-xs text-gray-500 py-6">Memuat diskusi...</div>
            ) : mainComments.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6">Belum ada komentar. Jadilah yang pertama!</div>
            ) : (
              mainComments.map((cmt) => {
                const replies = commentsList.filter(c => c.parent_id === cmt.id).reverse();
                
                return (
                  <div key={cmt.id} className="flex flex-col gap-2">
                    <div className="flex gap-3 bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl shadow-sm relative">
                       <Link href={`/profile/${cmt.user_id}`} className="w-10 h-10 rounded-xl bg-white/10 shrink-0 overflow-hidden border border-white/10 hover:border-red-500 transition-colors">
                         <img src={cmt.avatar_url || '/ic-profile.jpg'} alt="Avatar" className="w-full h-full object-cover"/>
                       </Link>
                       <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex gap-2 items-center">
                             <Link href={`/profile/${cmt.user_id}`} className="text-xs font-bold text-gray-200 hover:text-red-400 truncate">{cmt.username}</Link>
                             {cmt.role === 'admin' && <span className="bg-red-900 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase border border-red-800">Admin</span>}
                             {cmt.role === 'uploader' && <span className="bg-blue-900 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase border border-blue-800">Uploader</span>}
                             <span className="text-[10px] text-gray-500 ml-auto shrink-0">{new Date(cmt.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                             
                             <div className="relative z-[65]">
                               <button onClick={() => setOpenMenuId(openMenuId === cmt.id ? null : cmt.id)} className="text-gray-500 hover:text-white px-1">⋮</button>
                               {openMenuId === cmt.id && (
                                 <div className="absolute right-0 top-6 bg-[#111] border border-white/10 rounded-lg shadow-xl w-28 overflow-hidden text-xs py-1">
                                   <button onClick={handleReportComment} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5">Laporkan</button>
                                   {(currentUser?.id === cmt.user_id || currentUser?.role === 'admin') && (
                                     <button onClick={() => handleDeleteComment(cmt.id)} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-900/20 font-bold">Hapus</button>
                                   )}
                                 </div>
                               )}
                             </div>
                          </div>
                          
                          <div className="text-xs text-gray-300 mt-1.5 leading-relaxed break-words font-medium">
                            {renderFormattedContent(cmt.content)}
                          </div>
                          
                          <div className="mt-2 flex justify-end">
                            <button onClick={() => { setReplyingTo({ id: cmt.id, username: cmt.username, parent_id: cmt.id }); textareaRef.current?.focus(); }} className="text-[10px] font-bold text-gray-500 hover:text-red-400">Balas</button>
                          </div>
                       </div>
                    </div>

                    {replies.length > 0 && (
                      <div className="ml-12 mt-1">
                        <button onClick={() => toggleReplies(cmt.id)} className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-2">
                          <span className="w-6 h-[1px] bg-gray-600 inline-block"></span>
                          {showReplies[cmt.id] ? 'Sembunyikan Balasan' : `Lihat ${replies.length} Balasan`}
                        </button>
                      </div>
                    )}

                    {showReplies[cmt.id] && replies.length > 0 && (
                      <div className="ml-10 sm:ml-12 flex flex-col gap-3 mt-2 animate-fade-in border-l-2 border-white/5 pl-3">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 relative">
                             <Link href={`/profile/${reply.user_id}`} className="w-8 h-8 rounded-lg bg-white/10 shrink-0 overflow-hidden border border-white/10">
                               <img src={reply.avatar_url || '/ic-profile.jpg'} alt="Avatar" className="w-full h-full object-cover"/>
                             </Link>
                             <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex gap-2 items-center">
                                   <Link href={`/profile/${reply.user_id}`} className="text-[11px] font-bold text-gray-200 hover:text-red-400 truncate">{reply.username}</Link>
                                   {reply.role === 'admin' && <span className="bg-red-900 text-white text-[7px] font-extrabold px-1 py-0.5 rounded uppercase">Admin</span>}
                                   <span className="text-[9px] text-gray-500 ml-auto shrink-0">{new Date(reply.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                   
                                   <div className="relative z-[65]">
                                     <button onClick={() => setOpenMenuId(openMenuId === reply.id ? null : reply.id)} className="text-gray-500 hover:text-white px-1">⋮</button>
                                     {openMenuId === reply.id && (
                                       <div className="absolute right-0 top-6 bg-[#111] border border-white/10 rounded-lg shadow-xl w-28 overflow-hidden text-xs py-1">
                                         <button onClick={handleReportComment} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5">Laporkan</button>
                                         {(currentUser?.id === reply.user_id || currentUser?.role === 'admin') && (
                                           <button onClick={() => handleDeleteComment(reply.id)} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-900/20 font-bold">Hapus</button>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                </div>
                                <div className="text-[11px] text-gray-300 mt-1 leading-relaxed break-words">
                                  {renderFormattedContent(reply.content)}
                                </div>
                                <div className="mt-1 flex justify-end">
                                  <button onClick={() => { setReplyingTo({ id: reply.id, username: reply.username, parent_id: cmt.id }); textareaRef.current?.focus(); }} className="text-[10px] font-bold text-gray-500 hover:text-red-400">Balas</button>
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-6 w-full px-4 max-w-2xl left-1/2 -translate-x-1/2 z-50 flex justify-between items-end gap-3 transition-transform duration-500 ease-in-out ${navVisible ? 'translate-y-0' : 'translate-y-[200%]'}`}>
        <div className={`transition-opacity duration-100 ${isAtBottom ? 'invisible pointer-events-none select-none' : 'visible opacity-100'}`}>
          {prevCh ? (
            <Link href={`/baca/${komik}/${prevCh}`} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 shadow-lg"><img src="/ic-chevron-left.jpg" alt="Prev" className="w-5 h-5 mix-blend-screen opacity-80" /></Link>
          ) : <div className="w-12 h-12"></div>}
        </div>
        <div className="flex-1 relative flex justify-center">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-full px-5 py-2.5 flex gap-4 sm:gap-5 items-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <button onClick={() => setShowSettings(!showSettings)} className="hover:opacity-100 opacity-70 transition-opacity" title="Pengaturan Scroll"><img src="/ic-setting.jpg" alt="Setting" className="w-5 h-5 mix-blend-screen" /></button>
            <button onClick={() => { setIsAutoScrolling(!isAutoScrolling); setShowSettings(false); }} className="hover:opacity-100 opacity-70 transition-opacity" title="Auto Scroll"><img src="/ic-play.jpg" alt="Play" className={`w-5 h-5 mix-blend-screen transition-all ${isAutoScrolling ? 'filter sepia hue-rotate-[320deg] saturate-[500%]' : ''}`} /></button>
            <button className="hover:opacity-100 opacity-70 transition-opacity" title="Bookmark"><img src="/ic-bookmark.jpg" alt="Bookmark" className="w-5 h-5 mix-blend-screen" /></button>
            <div className="w-[1px] h-5 bg-white/20"></div>
            <Link href={`/manga/${komik}`} className="hover:opacity-100 opacity-70 transition-opacity" title="Detail Komik"><img src="/ic-menu.jpg" alt="Menu" className="w-5 h-5 mix-blend-screen" /></Link>
          </div>
        </div>
        <div className={`transition-opacity duration-100 ${isAtBottom ? 'invisible pointer-events-none select-none' : 'visible opacity-100'}`}>
          {nextCh ? (
            <Link href={`/baca/${komik}/${nextCh}`} className="w-12 h-12 bg-red-900/60 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-800/80 shadow-[0_0_15px_rgba(153,27,27,0.3)]"><img src="/ic-chevron-right.jpg" alt="Next" className="w-5 h-5 mix-blend-screen opacity-90" /></Link>
          ) : <div className="w-12 h-12"></div>}
        </div>
      </div>
    </div>
  );
}
