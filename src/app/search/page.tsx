'use client';
import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Mic, Search, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { PostCard } from '@/components/PostCard';
import { CommentModal } from '@/components/CommentModal';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);

const POSTS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_POSTS_INDEX || 'posts_index';
const USERS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_USERS_INDEX || 'users_index';

function fmtViews(n: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function UserHit({ hit }: { hit: any }) {
  return (
    <Link
      href={`/profile/${hit.objectID}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200 group"
    >
      <div className="relative w-14 h-14 shrink-0">
        {hit.avatar_url ? (
          <Image src={hit.avatar_url} alt={hit.username} fill className="rounded-full object-cover" unoptimized />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-accent-pink to-accent-green flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
        )}
        {hit.isPremium && (
          <div className="absolute -bottom-1 -right-1 bg-brand-gold text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
            PRO
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-semibold text-white truncate">@{hit.username}</p>
          {hit.isPremium && <span className="text-brand-gold text-xs">✔</span>}
        </div>
        {hit.name && <p className="text-sm text-white/60 truncate">{hit.name}</p>}
        {hit.bio && <p className="text-sm text-white/40 line-clamp-1 mt-0.5">{hit.bio}</p>}
        <div className="flex gap-3 mt-1 text-xs text-white/30">
          {hit.Follower_Count > 0 && <span>{fmtViews(hit.Follower_Count)} followers</span>}
          {hit.Total_likes > 0 && <span>{fmtViews(hit.Total_likes)} likes</span>}
        </div>
      </div>

      <button className="shrink-0 px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 transition-transform">
        Follow
      </button>
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(initialQ);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQ);
  const [commentingPost, setCommentingPost] = useState<any | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef('');

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (listening && transcript) setInputValue(transcript);
  }, [transcript, listening]);

  useEffect(() => {
    if (!listening && transcript.trim()) doSearch(transcript.trim());
  }, [listening]);

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || lastQueryRef.current === trimmed) return;
    lastQueryRef.current = trimmed;
    setCurrentQuery(trimmed);

    window.history.replaceState({}, '', `/search?q=${encodeURIComponent(trimmed)}`);

    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await searchClient.search([
        {
          indexName: POSTS_INDEX,
          query: trimmed,
          params: {
            hitsPerPage: 12,
            attributesToRetrieve: '*',
            attributesToSnippet: ['content:20'],
            snippetEllipsisText: '...',
          },
        },
        {
          indexName: USERS_INDEX,
          query: trimmed,
          params: { hitsPerPage: 5, attributesToRetrieve: '*', },
        },
      ]);
      setPosts((results.results[0] as any)?.hits.map((hit: any) => ({ ...hit, id: hit.objectID })) || []);
      setUsers((results.results[1] as any)?.hits || []);
    } catch (err) {
      console.error('Algolia search error:', err);
      setPosts([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!inputValue.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(inputValue), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputValue]);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    else inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastQueryRef.current = '';
    doSearch(inputValue);
  };

  const handleMic = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInputValue('');
      lastQueryRef.current = '';
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  const totalResults = posts.length + users.length;

  return (
    <div className="min-h-screen bg-background text-foreground pt-6 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="input-glass flex items-center px-4 w-full">
          <button
            type="button"
            onClick={handleMic}
            disabled={!browserSupportsSpeechRecognition}
            className={`p-2 rounded-full shrink-0 transition-colors ${listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-brand-saffron'}`}
            aria-label="Voice search"
          >
            <Mic size={20} />
          </button>
          <div className="w-px h-6 bg-glass-border mx-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { lastQueryRef.current = ''; setInputValue(e.target.value); }}
            placeholder={listening ? 'Listening...' : 'Search posts, users, hashtags...'}
            className="flex-1 bg-transparent py-3 text-lg font-body focus:outline-none min-w-0"
            autoComplete="off"
          />
          <button type="submit" className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10 shrink-0 transition-colors" aria-label="Search">
            <Search size={20} />
          </button>
        </form>

        {isLoading && (
          <div className="flex justify-center mt-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
          </div>
        )}

        {!isLoading && hasSearched && (
          <>
            <p className="text-sm text-white/30 mt-4 mb-6">
              {totalResults > 0 ? `About ${totalResults} results for "${currentQuery}"` : `No results for "${currentQuery}"`}
            </p>

            {users.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">People</h2>
                <div className="flex flex-col gap-2">
                  {users.map((u: any) => <UserHit key={u.objectID} hit={u} />)}
                </div>
              </section>
            )}

            {posts.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Posts</h2>
                <div className="flex flex-col gap-4">
                  {posts.map((p: any) => (
                    <PostCard 
                      key={p.objectID} 
                      post={p} 
                      onCommentClick={() => setCommentingPost(p)}
                      onImageClick={(url: string) => setFullScreenImage(url)}
                    />
                  ))}
                </div>
              </section>
            )}

            {totalResults === 0 && (
              <div className="text-center mt-24 text-white/40">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-semibold mb-1">No results found</p>
                <p className="text-sm">Try different keywords or check your spelling</p>
              </div>
            )}
          </>
        )}

        {!hasSearched && !isLoading && (
          <div className="text-center mt-24 text-white/30">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-base">Search for posts, users, and hashtags</p>
          </div>
        )}
      </div>
      {commentingPost && (
        <CommentModal 
          post={commentingPost} 
          postId={commentingPost.id} 
          postAuthorId={commentingPost.userId}
          collectionName="posts"
          onClose={() => setCommentingPost(null)} 
        />
      )}
      <FullScreenImageViewer imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
