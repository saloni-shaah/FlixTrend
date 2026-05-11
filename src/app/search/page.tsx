'use client';
import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Mic, Search, Video, Hash, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { PostCard } from '@/components/PostCard';
import { CommentModal } from '@/components/CommentModal';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import VerifiedBadge from '@/components/verifiedbadge';
import { FollowButton } from '@/components/FollowButton';

// ─── Algolia client (2 indices only, no replicas) ───────────────────────────
const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);
const POSTS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_POSTS_INDEX || 'posts_index';
const USERS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_USERS_INDEX || 'users_index';

// Only what PostCard actually needs
const POST_ATTRS = [
  'objectID', 'content', 'caption', 'username', 'displayName', 'avatar_url',
  'mediaUrl', 'thumbnailUrl', 'hashtags', 'viewCount', 'likesCount', 'isVideo',
  'type', 'createdAt', 'userId', 'fontStyle', 'backgroundColor',
  'pollOptions', 'question', 'correctAnswerIndex', 'song', 'mood',
];

const USER_ATTRS = ['objectID', 'name', 'username', 'bio', 'avatar_url', 'isPremium', 'Follower_Count'];

const TYPE_FILTERS = [
  { id: 'all',   label: 'All'   },
  { id: 'media', label: 'Media' },
  { id: 'text',  label: 'Text'  },
  { id: 'poll',  label: 'Poll'  },
  { id: 'relay', label: 'Relay' },
];

const SORT_OPTIONS = [
  { id: 'top',    label: 'Top',    key: 'likesCount' },
  { id: 'viral',  label: 'Viral',  key: 'viewCount'  },
  { id: 'recent', label: 'Recent', key: 'createdAt'  },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function clientSort(hits: any[], sortId: SortId) {
  const key = SORT_OPTIONS.find(s => s.id === sortId)!.key;
  return [...hits].sort((a, b) => (b[key] || 0) - (a[key] || 0));
}

// ─── User card (horizontal, compact) ─────────────────────────────────────────
function UserCard({ hit }: { hit: any }) {
  return (
    <Link href={`/squad/${hit.username}`} className="block">
      <div className="glass-card p-4 flex items-center gap-3 hover:border-accent-cyan transition-all">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white text-lg font-bold">
            {hit.avatar_url
              ? <Image src={hit.avatar_url} alt={hit.username} fill className="object-cover" unoptimized />
              : <span>{hit.name?.[0] || hit.username?.[0] || 'U'}</span>}
          </div>
          {hit.isPremium && (
            <div className="absolute -bottom-1 -right-1"><VerifiedBadge /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-headline text-accent-cyan text-sm truncate">{hit.name}</div>
          <div className="text-xs text-gray-400">@{hit.username}</div>
          {hit.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hit.bio}</p>}
          {(hit.Follower_Count || 0) > 0 && (
            <p className="text-xs text-gray-600">{fmt(hit.Follower_Count)} followers</p>
          )}
        </div>
        <div className="shrink-0">
          <FollowButton profileUser={hit} />
        </div>
      </div>
    </Link>
  );
}

// ─── Main search content ──────────────────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [input, setInput]               = useState(initialQ);
  const [posts, setPosts]               = useState<any[]>([]);
  const [users, setUsers]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [hasSearched, setHasSearched]   = useState(false);
  const [currentQ, setCurrentQ]         = useState(initialQ);
  const [commentPost, setCommentPost]   = useState<any | null>(null);
  const [fullImg, setFullImg]           = useState<string | null>(null);
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [showSug, setShowSug]           = useState(false);
  const [typeFilter, setTypeFilter]     = useState('all');
  const [videoOnly, setVideoOnly]       = useState(false);
  const [sortBy, setSortBy]             = useState<SortId>('top');

  const inputRef       = useRef<HTMLInputElement>(null);
  const debounceRef    = useRef<NodeJS.Timeout | null>(null);
  const lastKeyRef     = useRef('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => { if (listening && transcript) setInput(transcript); }, [transcript, listening]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!listening && transcript.trim()) runSearch(transcript.trim()); }, [listening]);

  // ── Core search (1 request = posts + optional users) ──
  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    setShowSug(false);

    const key = `${trimmed}|${typeFilter}|${videoOnly}`;
    if (lastKeyRef.current === key) return;

    if (!trimmed && typeFilter === 'all' && !videoOnly) {
      setPosts([]); setUsers([]); setHasSearched(false);
      lastKeyRef.current = key;
      return;
    }

    lastKeyRef.current = key;
    setCurrentQ(trimmed);
    window.history.replaceState({}, '', `/search?q=${encodeURIComponent(trimmed)}`);
    setLoading(true);
    setHasSearched(true);

    const isHashtag   = trimmed.startsWith('#');
    const postQuery   = isHashtag ? '' : trimmed;
    const hashFacet   = isHashtag ? trimmed.slice(1).toLowerCase() : null;

    const facets: string[][] = [];
    if (typeFilter !== 'all') facets.push([`type:${typeFilter}`]);
    if (videoOnly)             facets.push(['isVideo:true']);
    if (hashFacet)             facets.push([`hashtags:${hashFacet}`]);

    const queries: any[] = [
      {
        indexName: POSTS_INDEX,
        query: postQuery,
        params: {
          hitsPerPage: 30,                                  // fetch 30 → client-sort → show 15
          attributesToRetrieve: POST_ATTRS,
          facetFilters: facets.length ? facets : undefined,
        },
      },
    ];

    // Search users only for plain text queries (not hashtag/video/type filtered)
    const searchUsers = !isHashtag && !videoOnly && typeFilter === 'all';
    if (searchUsers) {
      queries.push({
        indexName: USERS_INDEX,
        query: trimmed,
        params: { hitsPerPage: 6, attributesToRetrieve: USER_ATTRS },
      });
    }

    try {
      const { results } = await searchClient.search(queries);
      const rawPosts = ((results[0] as any)?.hits || []).map((h: any) => ({ ...h, id: h.objectID }));
      setPosts(clientSort(rawPosts, sortBy).slice(0, 15));
      setUsers(searchUsers ? ((results[1] as any)?.hits || []) : []);
    } catch (err) {
      console.error('Search error:', err);
      setPosts([]); setUsers([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, videoOnly, sortBy]);

  // ── Autocomplete (users + hashtag facets, no extra index) ──
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSug(false); return; }
    try {
      const [userRes, tagRes] = await Promise.all([
        searchClient.search([{
          indexName: USERS_INDEX,
          query: q,
          params: { hitsPerPage: 3, attributesToRetrieve: ['username', 'name', 'avatar_url'] },
        }]),
        searchClient.searchForFacetValues([{
          indexName: POSTS_INDEX,
          params: { facetName: 'hashtags', facetQuery: q.replace(/^#/, ''), maxFacetHits: 3 },
        }]),
      ]);
      const userHits = ((userRes.results[0] as any)?.hits || []).map((h: any) => ({ ...h, _type: 'user' }));
      const tagHits  = (((tagRes as any)[0])?.facetHits || []).map((h: any) => ({ value: h.value, count: h.count, _type: 'hashtag' }));
      const all = [...userHits, ...tagHits];
      setSuggestions(all);
      setShowSug(all.length > 0);
    } catch { setSuggestions([]); setShowSug(false); }
  }, []);

  // debounce autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (input.trim() && document.activeElement === inputRef.current) fetchSuggestions(input);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, fetchSuggestions]);

  // close autocomplete on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // re-sort without re-fetching when sortBy changes
  useEffect(() => {
    setPosts(prev => clientSort([...prev], sortBy));
  }, [sortBy]);

  // re-search when type or video filter changes
  useEffect(() => {
    if (hasSearched && currentQ) { lastKeyRef.current = ''; runSearch(currentQ); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, videoOnly]);

  useEffect(() => {
    if (initialQ) runSearch(initialQ);
    else inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastKeyRef.current = '';
    runSearch(input);
  };

  const handleMic = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) SpeechRecognition.stopListening();
    else { resetTranscript(); setInput(''); lastKeyRef.current = ''; SpeechRecognition.startListening({ continuous: false }); }
  };

  const handleSuggestion = (s: any) => {
    const q = s._type === 'hashtag' ? `#${s.value}` : s.username;
    setInput(q);
    runSearch(q);
  };

  const clearInput = () => {
    setInput(''); setPosts([]); setUsers([]); setHasSearched(false); lastKeyRef.current = '';
    inputRef.current?.focus();
  };

  const total = posts.length + users.length;

  return (
    <div className="min-h-screen bg-transparent text-white pt-6 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Search bar ── */}
        <div className="relative w-full" ref={autocompleteRef}>
          <form onSubmit={handleSubmit} className="input-glass flex items-center px-4 w-full">
            <button
              type="button" onClick={handleMic}
              disabled={!browserSupportsSpeechRecognition}
              className={`p-2 rounded-full shrink-0 transition-colors ${
                listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-brand-saffron'
              }`}
              aria-label="Voice search"
            >
              <Mic size={20} />
            </button>
            <div className="w-px h-6 bg-glass-border mx-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={listening ? 'Listening...' : 'Search posts, creators, #hashtags...'}
              className="flex-1 bg-transparent py-3 text-base font-body focus:outline-none min-w-0"
              autoComplete="off"
              spellCheck={false}
            />
            {input && (
              <button type="button" onClick={clearInput} className="p-2 text-gray-500 hover:text-white shrink-0 transition-colors" aria-label="Clear">
                <X size={16} />
              </button>
            )}
            <button type="submit" className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10 shrink-0 transition-colors" aria-label="Search">
              <Search size={20} />
            </button>
          </form>

          {/* Autocomplete dropdown */}
          {showSug && (
            <div className="absolute top-full mt-2 w-full bg-background-light border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={e => { e.preventDefault(); handleSuggestion(s); }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  {s._type === 'user' ? (
                    <>
                      <Image
                        src={s.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'}
                        alt={s.username} width={32} height={32}
                        className="rounded-full object-cover shrink-0" unoptimized
                      />
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className="text-xs text-gray-400">@{s.username}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Hash size={14} className="text-accent-cyan" />
                      </div>
                      <span className="font-semibold text-sm">#{s.value}</span>
                      <span className="text-xs text-gray-400">{fmt(s.count)} posts</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Filters row ── */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
          {/* Video toggle */}
          <button
            onClick={() => setVideoOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              videoOnly ? 'bg-accent-cyan text-black' : 'border border-white/20 text-white'
            }`}
          >
            <Video size={13} /> Videos
          </button>

          <div className="w-px h-5 bg-glass-border shrink-0" />

          {/* Type filter */}
          {TYPE_FILTERS.map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${
                typeFilter === t.id ? 'bg-white text-black font-bold' : 'border border-white/20 text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          <div className="w-px h-5 bg-glass-border shrink-0" />

          {/* Sort */}
          {SORT_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${
                sortBy === s.id ? 'bg-brand-gold text-black font-bold' : 'border border-white/20 text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
          </div>
        )}

        {/* ── Results ── */}
        {!loading && hasSearched && (
          <>
            <p className="text-xs text-white/25 text-center mb-5">
              {total > 0
                ? `${total} results for "${currentQ}"`
                : `No results for "${currentQ}"`}
            </p>

            {/* People */}
            {users.length > 0 && (
              <section className="mb-6">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">People</p>
                <div className="flex flex-col gap-2">
                  {users.map((u: any) => <UserCard key={u.objectID} hit={u} />)}
                </div>
              </section>
            )}

            {/* Posts */}
            {posts.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">Posts</p>
                <div className="flex flex-col gap-4">
                  {posts.map((p: any) => (
                    <PostCard
                      key={p.objectID}
                      post={p}
                      onCommentClick={() => setCommentPost(p)}
                      onImageClick={(url: string) => setFullImg(url)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {total === 0 && (
              <div className="text-center mt-24 text-white/30">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-sm">No results found</p>
                <p className="text-xs mt-1">Try different keywords or a #hashtag</p>
              </div>
            )}
          </>
        )}

        {/* ── Idle state ── */}
        {!hasSearched && !loading && (
          <div className="text-center mt-28 text-white/25">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Search posts, creators or #hashtags</p>
          </div>
        )}
      </div>

      {commentPost && (
        <CommentModal
          post={commentPost}
          postId={commentPost.id}
          postAuthorId={commentPost.userId}
          collectionName="posts"
          onClose={() => setCommentPost(null)}
        />
      )}
      <FullScreenImageViewer imageUrl={fullImg} onClose={() => setFullImg(null)} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}