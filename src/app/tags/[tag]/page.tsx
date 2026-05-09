'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { PostCard } from '@/components/PostCard';
import { CommentModal } from '@/components/CommentModal';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { Search } from 'lucide-react';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);

const POSTS_INDEX = process.env.NEXT_PUBLIC_ALGOLIA_POSTS_INDEX || 'posts_index';

function TagPageContent() {
  const params = useParams();
  const tag = params.tag ? decodeURIComponent(params.tag as string) : '';

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentingPost, setCommentingPost] = useState<any | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) {
        setIsLoading(false);
        return;
    };

    const doSearch = async () => {
      setIsLoading(true);
      try {
        const index = searchClient.initIndex(POSTS_INDEX);
        const { hits } = await index.search('', {
          facetFilters: [`hashtags:${tag}`],
          attributesToRetrieve: ['*'],
        });
        setPosts(hits.map((hit: any) => ({ ...hit, id: hit.objectID })));
      } catch (err) {
        console.error('Algolia search error:', err);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    doSearch();
  }, [tag]);

  return (
    <div className="min-h-screen bg-background text-foreground pt-12 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Posts tagged with <span className="text-brand-gold">#{tag}</span>
        </h1>

        {isLoading ? (
          <div className="flex justify-center mt-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
          </div>
        ) : posts.length > 0 ? (
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
        ) : (
          <div className="text-center mt-24 text-white/40">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-semibold mb-1">No posts found</p>
            <p className="text-sm">There are no posts with the hashtag #{tag}.</p>
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


export default function TagPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-cyan border-t-transparent" />
            </div>
        }>
            <TagPageContent />
        </Suspense>
    );
}
