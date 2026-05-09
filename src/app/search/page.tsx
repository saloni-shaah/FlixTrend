'use client';
import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Mic, Search, Play, Hash, User } from 'lucide-react';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ''
);

const POSTS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_POSTS_INDEX || 'posts_index';
const USERS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_USERS_INDEX || 'users_index';

function fmtViews(n: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PostHit({ hit }: { hit: any }) {
  const isVideo = hit.isVideo || (hit.mediaUrl && JSON.stringify(hit.mediaUrl).match(/\.(mp4|webm)/i));
  const href = isVideo ? `/watch?v=${hit.objectID}` : `/post/${hit.objectID}`;
  return (
    <Link
      href={href}
      className="flex gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="w-28 h-16 shrink-0 rounded-lg bg-gradient-to-tr from-accent-pink/20 to-accent-green/20 flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <Play size={24} className="text-white/40 group-hover:text-accent-cyan transition-colors" />
        ) : (
          <Hash size={24} className="text-white/40 group-hover:text-accent-cyan transition-colors" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-accent-cyan transition-colors line-clamp-2 leading-snug">
          {hit.content || 'Untitled'}
        </p>
        <p className="text-xs text-white/50 mt-1">@{hit.username}</p>
        {hit.viewCount > 0 && (
          <p className="text-xs text-white/30 mt-0.5">{fmtViews(hit.viewCount)} views</p>
        )}
        {hit.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {hit.hashtags.slice(0, 4).map((tag: string) => (
              <span key={tag} className="text-xs text-accent-cyan/70">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function UserHit({ hit }: { hit: any }) {
  return (
    <Link
      href={`/profile/${hit.objectID}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-accent-pink to-accent-green">
        {hit.avatar_url ? (
          <img src={hit.avatar_url} alt={hit.username} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {hit.username?.[0]?.toUpperCase() || <User size={18} />}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white group-hover:text-accent-cyan transition-colors truncate">
          @{hit.username}
        </p>
        {hit.bio && <p className="text-sm text-white/50 line-clamp-1 mt-0.5">{hit.bio}</p>}
        {hit.Follower_Count > 0 && (
          <p className="text-xs text-white/30 mt-0.5">{fmtViews(hit.Follower_Count)} followers</p>
        )}
      </div>
      <span className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 group-hover:border-accent-cyan/50 group-hover:text-accent-cyan transition-colors">
        Follow
      </span>
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(initialQ);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setInputValue(transcript);
  }, [transcript]);

  // When mic stops and has content, auto-search
  useEffect(() => {
    if (!listening && transcript.trim()) {
      doSearch(transcript.trim());
    }
  }, [listening]);

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setCurrentQuery(trimmed);
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await (searchClient as any).search([
        {
          indexName: POSTS_INDEX,
          query: trimmed,
          params: { hitsPerPage: 12, attributesToRetrieve: ['objectID', 'content', 'username', 'userId', 'isVideo', 'mediaUrl', 'hashtags', 'viewCount', 'publishAt'] },
        },
        {
          indexName: USERS_INDEX,
          query: trimmed,
          params: { hitsPerPage: 5, attributesToRetrieve: ['objectID', 'username', 'avatar_url', 'bio', 'Follower_Count'] },
        },
      ]);
      setPosts(results.results[0]?.hits || []);
      setUsers(results.results[1]?.hits || []);
    } catch (err) {
      console.error('Algolia search error:', err);
      setPosts([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run search on initial load if URL has query
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    else inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputValue);
  };

  const handleMic = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInputValue('');
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  const totalResults = posts.length + users.length;

  return (
    <div className="min-h-screen bg-background text-foreground pt-6 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="input-glass flex items-center px-4 w-full"
        >
          <button
            type="button"
            onClick={handleMic}
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={listening ? 'Listening...' : 'Search posts, users, hashtags...'}
            className="flex-1 bg-transparent py-3 text-lg font-body focus:outline-none min-w-0"
            autoComplete="off"
          />
          <button
            type="submit"
            className="p-2 rounded-full text-brand-gold hover:bg-brand-gold/10 shrink-0 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </form>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center mt-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
          </div>
        )}

        {/* Results */}
        {!isLoading && hasSearched && (
          <>
            <p className="text-sm text-white/30 mt-4 mb-6">
              {totalResults > 0
                ? `About ${totalResults} results for "${currentQuery}"`
                : `No results for "${currentQuery}"`}
            </p>

            {/* Users */}
            {users.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                  People
                </h2>
                <div className="flex flex-col gap-2">
                  {users.map((u: any) => (
                    <UserHit key={u.objectID} hit={u} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {posts.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Posts
                </h2>
                <div className="flex flex-col gap-2">
                  {posts.map((p: any) => (
                    <PostHit key={p.objectID} hit={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty */}
            {totalResults === 0 && (
              <div className="text-center mt-24 text-white/40">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-semibold mb-1">No results found</p>
                <p className="text-sm">Try different keywords or check your spelling</p>
              </div>
            )}
          </>
        )}

        {/* Idle state */}
        {!hasSearched && !isLoading && (
          <div className="text-center mt-24 text-white/30">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-base">Search for posts, users, and hashtags</p>
          </div>
        )}
      </div>
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